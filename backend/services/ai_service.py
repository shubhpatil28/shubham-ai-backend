import json
import datetime
import random
from openai import OpenAI
from config import OPENAI_API_KEY
import database
from services.memory_engine import get_memory_engine
from services.command_router import get_command_router, RouteMode

class AIService:
    def __init__(self):
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        self.memory_engine = get_memory_engine()
        self.command_router = get_command_router()
        print("[AIService] Initialized with Semantic Memory Engine + Command Router integration.")

    def process_message(self, user_message):
        """Processes the user's message, retrieves history & memory context, and returns (response_text, action_dict)."""
        # Save user message to history
        database.add_chat_log("user", user_message)
        
        # 🧭 Route Classification — decide what kind of request this is
        route = self.command_router.classify(user_message)
        route_mode = route["mode"]
        route_confidence = route["confidence"]
        route_metadata = route["metadata"]
        route_emoji = self.command_router.get_mode_emoji(route_mode)
        print(f"[CommandRouter] {route_emoji} Classified as '{route_mode}' (confidence: {route_confidence}) | metadata: {route_metadata}")
        
        # Load dynamic semantic memory context based on the user message
        memory_context = self.memory_engine.build_context(user_message, max_items=10)
        
        # Get chat history for conversational flow
        chat_history = database.get_chat_history(limit=6)
        
        # Current local time
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if self.openai_client:
            try:
                # Prepare message history
                system_prompt = f"""You are "Shubham AI", Shubham's personal AI buddy — smart, casual, and motivational like a close dost/bhai.
You communicate in a warm mix of Marathi and English (Marathish style: mixing both languages naturally in a single sentence, like a close Indian friend).
Be proactive! Suggest daily task completions, motivate him to build, and remind him of his startup ideas or goals when relevant.
Always be positive and encouraging. Use emojis occasionally (😄, 🔥, 🚀, 💻).

CRITICAL RULE: Never repeat the exact same response or fallback text. Keep it dynamic and conversational! Always acknowledge the recent context.

IMPORTANT: Analyze the user's input carefully, and classify the intent. Return a SINGLE JSON response ONLY with no extra text.

The JSON schema must be:
{{
  "response": "Your warm buddy reply in Marathi + English mix, matching the buddy persona.",
  "action": {{
    "type": null | "open_app" | "browser_search" | "add_task" | "generate_site" 
           | "save_memory" | "forget_memory" | "search_memory"
           | "whatsapp_open" | "whatsapp_send" | "whatsapp_open_contact"
           | "whatsapp_send_file" | "whatsapp_upload_status" | "whatsapp_read_messages" | "whatsapp_schedule",
    
    "app_name": "notepad|calculator|chrome|explorer|vscode|etc" (for open_app only),
    
    "recipient": "contact name or nickname" (for whatsapp_send / whatsapp_open_contact / whatsapp_send_file / whatsapp_schedule),
    "message": "message text to send" (for whatsapp_send / whatsapp_schedule),
    "file_path": "absolute file path" (for whatsapp_send_file / whatsapp_upload_status only, if specified),
    "scheduled_time": "YYYY-MM-DD HH:MM:SS" (for whatsapp_schedule only),
    
    "query": "search or memory query terms" (for browser_search / search_memory only),
    
    "title": "task title or memory title" (for add_task / save_memory only),
    "content": "memory content detail" (for save_memory only),
    "category": "goal|project|ui_style|routine|contact|business_idea|preference|fact|skill|note" (for save_memory / search_memory only),
    "tags": "space-separated keywords" (for save_memory only),
    "importance": 1-10 (integer, for save_memory only),
    "memory_id": integer (for forget_memory only),
    
    "date": "YYYY-MM-DD" (for add_task only),
    "time": "HH:MM or null" (for add_task only),
    "priority": "low|medium|high" (for add_task only),
    
    "prompt": "detailed site design description" (for generate_site only),
    "site_name": "lowercase_underscored_identifier" (for generate_site only)
  }}
}}

Intent Guidance for Memory & AI Assistant:
- Remember goals/routines/projects/ideas: e.g. "Maza dhyey ahe startup launch karna" or "Remember that my fav style is minimal dark mode"
  -> type: save_memory, category: "goal" (or "ui_style"), title: "Startup Launch", content: "Maza dhyey ahe startup launch karna", importance: 8
- Delete or forget a fact: e.g. "Forget memory 5" or "Forget my morning routine"
  -> type: forget_memory, memory_id: 5 (or search and retrieve to find ID)
- WhatsApp scheduling: e.g. "Schedule happy birthday to Rahul at 2026-05-23 00:00:00"
  -> type: whatsapp_schedule, recipient: "Rahul", message: "Happy birthday!", scheduled_time: "2026-05-23 00:00:00"

Current User Semantic Memory Context (dynamic relevance match):
{memory_context}

🧭 Command Router Classification:
- Detected Mode: {route_mode} ({route_emoji})
- Confidence: {route_confidence}
- Pre-extracted metadata: {json.dumps(route_metadata)}
Use this routing signal to align your response. For example, if mode is "chat", respond conversationally. If mode is "execute", focus on the action. If mode is "code_help", provide programming guidance.

Current timestamp: {current_time}
"""
                messages = [{"role": "system", "content": system_prompt}]
                
                # Append recent chat history
                for chat in chat_history:
                    role = "user" if chat['sender'] == 'user' else "assistant"
                    content = chat['message']
                    if role == "assistant":
                        # If the assistant stored a JSON string, extract just the response text to avoid confusing the model
                        try:
                            content = json.loads(content).get("response", content)
                        except:
                            pass
                    messages.append({"role": role, "content": content})
                
                # Append current user message
                messages.append({"role": "user", "content": user_message})
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=250,
                    response_format={"type": "json_object"}
                )
                
                response_content = response.choices[0].message.content
                print(f"[AI Raw Response]: {response_content}")
                
                # Parse JSON
                parsed_res = json.loads(response_content)
                ai_text = parsed_res.get("response", "")
                action = parsed_res.get("action", None)
                
                # Handle database side-effects (tasks, memories)
                self._execute_db_side_effects(action)
                
                # Save AI response to logs
                database.add_chat_log("ai", response_content)
                
                return ai_text, action
                
            except Exception as e:
                print(f"OpenAI Chat API failed: {e}. Falling back to offline rule-based processor.")
                
        # Rule-based offline fallback
        return self._offline_processor(user_message, memory_context, current_time, route)

    def _execute_db_side_effects(self, action):
        """Executes database updates (like tasks, memory engine storage, scheduling) from action."""
        if not action:
            return
            
        action_type = action.get("type")
        
        # 1. Memory Engine Integrations
        if action_type == "save_memory":
            title = action.get("title")
            content = action.get("content") or action.get("value")
            category = action.get("category") or "note"
            tags = action.get("tags") or ""
            importance = action.get("importance") or 5
            if title and content:
                mem_id = self.memory_engine.remember(title, content, category, tags, importance)
                print(f"[MemoryEngine Action] Saved memory ID {mem_id}: [{category}] {title}")
                
        elif action_type == "forget_memory":
            memory_id = action.get("memory_id")
            if memory_id:
                self.memory_engine.forget(int(memory_id))
                print(f"[MemoryEngine Action] Soft-deleted memory ID {memory_id}")
                
        elif action_type == "search_memory":
            query = action.get("query")
            category = action.get("category")
            if query:
                results = self.memory_engine.recall(query, category=category)
                print(f"[MemoryEngine Action] Searched for '{query}': Found {len(results)} results.")

        # 2. Planner Task Additions
        elif action_type == "add_task":
            title = action.get("title")
            date = action.get("date") or datetime.date.today().isoformat()
            time_val = action.get("time")
            priority = action.get("priority") or "medium"
            if title:
                database.add_task(title=title, date=date, scheduled_time=time_val, priority=priority)
                print(f"[DB Update] Added Task: {title} on {date} at {time_val} (Priority: {priority})")

        # 3. WhatsApp Scheduler
        elif action_type == "whatsapp_schedule":
            recipient = action.get("recipient")
            message = action.get("message")
            scheduled_time = action.get("scheduled_time")
            file_path = action.get("file_path")
            if recipient and message and scheduled_time:
                sched_id = database.add_scheduled_message(recipient, message, scheduled_time, file_path)
                print(f"[Scheduler DB Update] Scheduled message ID {sched_id} to {recipient} at {scheduled_time}")

    def _offline_processor(self, message, memory_context, current_time, route=None):
        """Marathish rule-based offline buddy processor — no OpenAI key needed. Enhanced with Command Router."""
        ml = message.lower()
        route_mode = route["mode"] if route else None
        route_meta = route.get("metadata", {}) if route else {}
        action = None
        response_text = "Offline mode मध्ये आहे मी, पण बघतो काय करता येईल 😄 "

        # ---- Memory remembering ----
        if any(t in ml for t in ["sathav", "remember", "lakshat thev", "store"]):
            # Extract content to remember
            clean_msg = message
            for tw in ["remember", "sathav", "lakshat thev", "store", "maza style"]:
                clean_msg = clean_msg.lower().replace(tw, "").strip()
            if clean_msg:
                # Save dynamically in memory engine
                mem_id = self.memory_engine.smart_remember(clean_msg)
                category = self.memory_engine.auto_categorize(clean_msg)
                response_text = f"Sure, me lakshat thevlay! [{category.upper()}] memory add zali ahe (ID: {mem_id}) 🧠"
                action = {"type": "save_memory", "title": clean_msg[:40], "content": clean_msg, "category": category}
            else:
                response_text = "काय लक्षात ठेवायचं आहे, ते नीट सांग ना, मित्रा! 🧠"

        # ---- Memory search / list ----
        elif any(t in ml for t in ["check memory", "what is my goal", "daily routine", "projects", "ideas", "business ideas"]):
            # Search memory semantically or fetch categories
            if "routine" in ml:
                items = self.memory_engine.get_routines()
                cat_name = "Routines"
            elif "project" in ml:
                items = self.memory_engine.get_projects()
                cat_name = "Projects"
            elif "goal" in ml:
                items = self.memory_engine.get_goals()
                cat_name = "Goals"
            elif "business" in ml or "idea" in ml:
                items = self.memory_engine.get_business_ideas()
                cat_name = "Business Ideas"
            else:
                # Semantic search fallback
                query = ml.replace("memory", "").replace("check", "").strip()
                items = self.memory_engine.recall(query, top_k=3)
                cat_name = "Search Results"
                
            if items:
                reply_parts = [f"Tuze {cat_name} lakshat ahet maza:"]
                for it in items[:4]:
                    title_or_content = it.get('title') or it.get('content')
                    reply_parts.append(f"• {title_or_content}")
                response_text = "\n".join(reply_parts)
            else:
                response_text = f"Ajun tari konti memory context related sapadli nahi. Add karun thevuya? 😄"

        # ---- WhatsApp: send message ----
        elif any(t in ml for t in ["send kar", "message kar", "message send", "la pathav"]):
            recipient = "friend"
            msg_text = message
            for sep in [" la ", " ला ", " को "]:
                if sep in ml:
                    parts = ml.split(sep, 1)
                    recipient = parts[0].strip().split()[-1]
                    msg_text_raw = parts[1].strip()
                    for tw in ["send kar", "message kar", "message send", "la pathav", "pathav"]:
                        msg_text_raw = msg_text_raw.replace(tw, "").strip()
                    msg_text = msg_text_raw or "Hello!"
                    break
            response_text = f"Chalo, {recipient} ला WhatsApp message send करतोय! 🚀"
            action = {"type": "whatsapp_send", "recipient": recipient, "message": msg_text.capitalize()}

        # ---- WhatsApp: schedule ----
        elif any(t in ml for t in ["schedule kar", "natar pathav"]):
            recipient = "friend"
            # Hardcoded parsing helper for offline mode
            response_text = "WhatsApp message schedule करतोय! DateTime and message parameters check kar. ⏰"
            action = {"type": "whatsapp_schedule", "recipient": "friend", "message": "Scheduled Message", "scheduled_time": (datetime.datetime.now() + datetime.timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")}

        # ---- WhatsApp: upload status ----
        elif "status" in ml and any(t in ml for t in ["upload", "lav", "tak", "post"]):
            response_text = "Status update task queue मध्ये transfer kartoy. File path specify kela ahe ka? 📸"
            action = {"type": "whatsapp_upload_status", "file_path": None}

        # ---- WhatsApp: read messages ----
        elif any(t in ml for t in ["message vach", "messages vach", "read messages", "koni pathavla"]):
            response_text = "Latest chats read kartoy WhatsApp browser varun! 📖"
            action = {"type": "whatsapp_read_messages"}

        # ---- WhatsApp: open WhatsApp / contact ----
        elif "whatsapp ughadh" in ml or "whatsapp open" in ml or "open whatsapp" in ml:
            response_text = "WhatsApp Web login confirm kartoy! 🌐"
            action = {"type": "whatsapp_open"}
        elif any(t in ml for t in ["call kar", "chat open kar", "open chat"]):
            recipient = ml.split(" ")[0].strip()
            response_text = f"{recipient.capitalize()} cha chat window open kartoy. 💬"
            action = {"type": "whatsapp_open_contact", "recipient": recipient}

        # ---- Site generation: "website banav" ----
        elif any(t in ml for t in ["website banav", "website bana", "site banav", "webpage bana", "generate website", "site generate kar"]):
            prompt_text = message
            for tw in ["website banav", "website bana", "site banav", "webpage bana", "generate website", "site generate kar"]:
                prompt_text = prompt_text.lower().replace(tw, "").strip()
            site_name = "_".join(prompt_text.split()[:3]) or "ai_website"
            full_prompt = f"{prompt_text} website" if prompt_text else "Modern stunning startup website"
            response_text = f"Ekdam premium design, '{full_prompt}' active built process start hot ahe! 💻🔥"
            action = {"type": "generate_site", "prompt": full_prompt, "site_name": site_name}

        # ---- Open App commands ----
        elif any(t in ml for t in ["open calculator", "calculator ughadh", "calc"]):
            response_text = "Calculator start kartoy! 🔢"
            action = {"type": "open_app", "app_name": "calculator"}
        elif any(t in ml for t in ["open notepad", "notepad ughadh", "notepad"]):
            response_text = "Notepad window open zali ahe! 📝"
            action = {"type": "open_app", "app_name": "notepad"}
        elif any(t in ml for t in ["open chrome", "chrome ughadh", "browser ughadh"]):
            response_text = "Chrome browser start kartoy! 🌐"
            action = {"type": "open_app", "app_name": "chrome"}
        elif any(t in ml for t in ["explorer", "files ughadh", "my computer"]):
            response_text = "File Explorer navigate karto! 📁"
            action = {"type": "open_app", "app_name": "explorer"}

        # ---- Google Search ----
        elif any(t in ml for t in ["search for", "google search", "google kar", "search kar"]):
            query = ml
            for tw in ["search for", "google search", "google kar", "search kar"]:
                query = query.replace(tw, "").strip()
            response_text = f"Google वर '{query}' cha results open hot ahet browser madhe! 🔍"
            action = {"type": "browser_search", "query": query}

        # ---- Planner task add ----
        elif any(t in ml for t in ["task add", "add task", "plan kar", "reminder"]):
            task_title = message
            for tw in ["task add kar", "add task", "plan kar", "reminder"]:
                task_title = task_title.lower().replace(tw, "").strip()
            today_str = datetime.date.today().isoformat()
            database.add_task(title=task_title.capitalize() or message, date=today_str)
            response_text = f"Today's planner madhe '{task_title.capitalize()}' add keli ahe! ✅"
            action = {"type": "add_task", "title": task_title.capitalize(), "date": today_str, "time": None}

        # ---- General conversation ----
        else:
            greetings = [
                "काय चाललंय मित्रा? आज काहीतरी innovative बनवूया का? 🚀",
                "Hello, Shubham! Systems perfect ahet, tuzi coding start karaychi ka? 💻🔥",
                "Hi buddy! Goals lakshat thev ani complete kar! Tuze plans bol aaj kay karaycha ahe. 😄",
                "मी ready आहे! आज database build, website creation, ki status upload update karu? 💪"
            ]
            response_text = random.choice(greetings)

        # Save response payload to history
        res_payload = {"response": response_text, "action": action}
        database.add_chat_log("ai", json.dumps(res_payload))
        return response_text, action
