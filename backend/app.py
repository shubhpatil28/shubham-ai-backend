import os
import threading
import datetime
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS

import config
import database
from services.voice_service import VoiceService
from services.ai_service import AIService
from services.automation import AutomationService
from services.site_generator import SiteGeneratorService
from services.whatsapp_service import WhatsAppService
from services.scheduler_service import SchedulerService
from services.memory_engine import get_memory_engine
from services.command_router import get_command_router

app = Flask(__name__)
# Enable CORS for React development server
CORS(app)

# Initialize WhatsApp Selenium Worker
whatsapp_service = WhatsAppService()

# Initialize Automation with shared WhatsApp instance
automation_service = AutomationService(whatsapp_service)

# Initialize Scheduler with shared WhatsApp instance & start polling
scheduler_service = SchedulerService(whatsapp_service)
scheduler_service.start()

# Initialize AI and other services
ai_service = AIService()
site_gen_service = SiteGeneratorService()
voice_service = VoiceService()
memory_engine = get_memory_engine()
command_router = get_command_router()

def execute_action(action):
    """Executes automation actions in response to AI decisions."""
    if not action:
        return None
        
    action_type = action.get("type")
    print(f"[App Action Dispatcher] Dispatching action: {action_type}")
    
    try:
        # Standard Desktop Automation
        if action_type == "open_app":
            app_name = action.get("app_name")
            return automation_service.open_app(app_name)
            
        elif action_type == "browser_search":
            query = action.get("query")
            return automation_service.browser_search(query)
            
        # Website Generation
        elif action_type == "generate_site":
            prompt = action.get("prompt")
            site_name = action.get("site_name")
            res = site_gen_service.generate_website(prompt, site_name)
            return f"Website '{site_name}' layout has been generated! View it at {res['preview_url']}"

        # WhatsApp Web Automation Actions
        elif action_type == "whatsapp_open":
            return automation_service.open_whatsapp()
            
        elif action_type == "whatsapp_send":
            recipient = action.get("recipient")
            message = action.get("message")
            return automation_service.send_whatsapp_message(recipient, message)
            
        elif action_type == "whatsapp_open_contact":
            recipient = action.get("recipient")
            return automation_service.open_contact_chat(recipient)
            
        elif action_type == "whatsapp_send_file":
            recipient = action.get("recipient")
            file_path = action.get("file_path")
            return automation_service.send_whatsapp_file(recipient, file_path)
            
        elif action_type == "whatsapp_upload_status":
            file_path = action.get("file_path")
            return automation_service.upload_status(file_path)
            
        elif action_type == "whatsapp_read_messages":
            recipient = action.get("recipient")
            res = automation_service.read_latest_messages(recipient)
            if isinstance(res, list):
                msg_list = [f"{m['sender']}: {m['text']}" for m in res]
                return f"Latest messages: " + ", ".join(msg_list)
            return res
            
        elif action_type == "whatsapp_schedule":
            recipient = action.get("recipient")
            message = action.get("message")
            sched_time = action.get("scheduled_time")
            file_path = action.get("file_path")
            if recipient and message and sched_time:
                database.add_scheduled_message(recipient, message, sched_time, file_path)
                return f"Message to {recipient} scheduled successfully at {sched_time}."
                
        # Semantic Memory Actions (already executed in side-effects, confirm here)
        elif action_type == "save_memory":
            return f"Shubham AI buddy memory successfully saved to SQLite and Indexed! 🧠"
            
        elif action_type == "forget_memory":
            return f"Memory removed successfully from brain. 🧠"

    except Exception as e:
        print(f"Error executing action {action_type}: {e}")
        return f"Action execution error: {e}"
        
    return None

async def voice_chat_callback(command):
    """Callback for the background voice listening thread."""
    print(f"[Voice Callback] Received command from voice: '{command}'")
    response_text, action = ai_service.process_message(command)
    
    # Run the action execution
    action_log = execute_action(action)
    if action_log:
        print(f"[Voice Callback Action Log]: {action_log}")
        
    return response_text

# Serve generated sites statically
@app.route('/generated_sites/<path:path>')
def serve_generated_sites(path):
    return send_from_directory(config.SITES_DIR, path)

# --- API Routes ---

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handles text-based chat from the UI, executing actions if triggered."""
    data = request.json or {}
    message = data.get("message", "").strip()
    
    if not message:
        return jsonify({"error": "Message is empty"}), 400
        
    response_text, action = ai_service.process_message(message)
    action_result = execute_action(action)
    
    # Classify the message route for frontend display
    route = command_router.classify(message)
    
    # Play response audio in a non-blocking thread
    def speak_async():
        voice_service.speak(response_text)
    
    threading.Thread(target=speak_async, daemon=True).start()
    
    return jsonify({
        "response": response_text,
        "action": action,
        "action_result": action_result,
        "route": route
    })

@app.route('/api/route', methods=['POST'])
def classify_route():
    """Classify a user message into a route mode without sending to AI."""
    data = request.json or {}
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"error": "Message is empty"}), 400
    
    route = command_router.classify(message)
    route["label"] = command_router.get_mode_label(route["mode"])
    route["emoji"] = command_router.get_mode_emoji(route["mode"])
    return jsonify(route)

@app.route('/api/chat-history', methods=['GET'])
def get_chat_history():
    """Retrieves chat logs."""
    history = database.get_chat_history()
    return jsonify(history)

# --- Planner Tasks API ---

@app.route('/api/planner', methods=['GET', 'POST'])
def planner():
    """CRUD operations for the Daily Planner / Tasks."""
    if request.method == 'GET':
        date = request.args.get("date")
        tasks = database.get_tasks(date)
        return jsonify(tasks)
        
    elif request.method == 'POST':
        data = request.json or {}
        title = data.get("title")
        date = data.get("date")
        scheduled_time = data.get("time")
        priority = data.get("priority", "medium")
        
        if not title:
            return jsonify({"error": "Task title is required"}), 400
            
        task_id = database.add_task(title, date, scheduled_time, priority)
        return jsonify({"message": "Task added", "id": task_id})

@app.route('/api/planner/<int:task_id>', methods=['PUT', 'DELETE'])
def update_delete_task(task_id):
    """Updates status or deletes a task."""
    if request.method == 'PUT':
        data = request.json or {}
        status = data.get("status")
        if not status:
            return jsonify({"error": "Status is required"}), 400
        database.update_task_status(task_id, status)
        return jsonify({"message": "Task status updated"})
        
    elif request.method == 'DELETE':
        database.delete_task(task_id)
        return jsonify({"message": "Task deleted"})

# --- Semantic Memory Engine API ---

@app.route('/api/memory', methods=['GET', 'POST'])
def memory():
    """Retrieves or adds facts to long-term memory."""
    if request.method == 'GET':
        # Retrieve all memories structured by memory engine
        memories = memory_engine.get_all_memories()
        return jsonify(memories)
        
    elif request.method == 'POST':
        data = request.json or {}
        title = data.get("title")
        content = data.get("content") or data.get("value")
        category = data.get("category", "note")
        tags = data.get("tags", "")
        importance = int(data.get("importance", 5))
        
        if not title or not content:
            return jsonify({"error": "Title and Content/Value are required"}), 400
            
        mem_id = memory_engine.remember(title, content, category, tags, importance)
        return jsonify({"message": "Memory saved successfully", "id": mem_id})

@app.route('/api/memory/<int:memory_id>', methods=['PUT', 'DELETE'])
def memory_modify(memory_id):
    """Updates or soft-deletes a semantic memory."""
    if request.method == 'PUT':
        data = request.json or {}
        title = data.get("title")
        content = data.get("content")
        category = data.get("category")
        tags = data.get("tags")
        importance = data.get("importance")
        
        success = memory_engine.update_memory(memory_id, title, content, category, tags, importance)
        if success:
            return jsonify({"message": "Memory updated"})
        return jsonify({"error": "Memory not found"}), 404
        
    elif request.method == 'DELETE':
        memory_engine.forget(memory_id)
        return jsonify({"message": "Memory forgotten successfully"})

@app.route('/api/memory/search', methods=['GET'])
def memory_search():
    """Searches memory semantically using TF-IDF."""
    query = request.args.get("query", "")
    category = request.args.get("category")
    if not query:
        return jsonify({"error": "Query is required"}), 400
    results = memory_engine.recall(query, category=category)
    return jsonify(results)

@app.route('/api/memory/insights', methods=['GET'])
def memory_insights():
    """Gets insights and stats about memory usage."""
    insights = memory_engine.get_insights()
    return jsonify(insights)

@app.route('/api/memory/daily-summary', methods=['GET'])
def memory_daily_summary():
    """Retrieves a formatted daily summary (goals, routines, active projects)."""
    summary = memory_engine.get_daily_summary()
    return jsonify({"summary": summary})

@app.route('/api/memory/export', methods=['GET'])
def memory_export():
    """Triggers export of all memories to a JSON backup file."""
    try:
        filepath = memory_engine.export_to_json()
        with open(filepath, 'r', encoding='utf-8') as f:
            data = f.read()
        
        response = make_response(data)
        response.headers.set('Content-Type', 'application/json')
        response.headers.set('Content-Disposition', 'attachment', filename=os.path.basename(filepath))
        return response
    except Exception as e:
        return jsonify({"error": f"Failed to export: {e}"}), 500

@app.route('/api/memory/import', methods=['POST'])
def memory_import():
    """Imports memories from an uploaded JSON backup file."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    try:
        # Save temp file
        temp_path = os.path.join(os.path.dirname(config.DB_PATH), "temp_import.json")
        file.save(temp_path)
        
        # Merge import
        count = memory_engine.import_from_json(temp_path, merge=True)
        os.remove(temp_path)
        
        return jsonify({"message": f"Successfully imported and merged {count} memories!"})
    except Exception as e:
        return jsonify({"error": f"Failed to import: {e}"}), 500


# --- WhatsApp REST API ---

@app.route('/api/whatsapp/status', methods=['GET'])
def whatsapp_status():
    """Returns Selenium status & active contacts/schedules stats."""
    return jsonify({
        "driver_status": whatsapp_service.get_status(),
        "queue_size": whatsapp_service.task_queue.qsize()
    })

@app.route('/api/whatsapp/open', methods=['POST'])
def whatsapp_open_api():
    """Launches WhatsApp Web browser instance."""
    res = automation_service.open_whatsapp()
    return jsonify({"message": res})

@app.route('/api/whatsapp/open-contact', methods=['POST'])
def whatsapp_open_contact_api():
    """Navigates to a specific contact's chat."""
    data = request.json or {}
    recipient = data.get("recipient")
    if not recipient:
        return jsonify({"error": "Recipient is required"}), 400
    res = automation_service.open_contact_chat(recipient)
    return jsonify({"message": res})

@app.route('/api/whatsapp/send', methods=['POST'])
def whatsapp_send_api():
    """Sends a text message through Selenium worker."""
    data = request.json or {}
    recipient = data.get("recipient")
    message = data.get("message")
    if not recipient or not message:
        return jsonify({"error": "Recipient and message are required"}), 400
    res = automation_service.send_whatsapp_message(recipient, message)
    return jsonify({"message": res})

@app.route('/api/whatsapp/send-file', methods=['POST'])
def whatsapp_send_file_api():
    """Sends a file attachment through Selenium worker."""
    data = request.json or {}
    recipient = data.get("recipient")
    file_path = data.get("file_path")
    if not recipient or not file_path:
        return jsonify({"error": "Recipient and file_path are required"}), 400
    res = automation_service.send_whatsapp_file(recipient, file_path)
    return jsonify({"message": res})

@app.route('/api/whatsapp/upload-status', methods=['POST'])
def whatsapp_upload_status_api():
    """Uploads media status update."""
    data = request.json or {}
    file_path = data.get("file_path")
    res = automation_service.upload_status(file_path)
    return jsonify({"message": res})

@app.route('/api/whatsapp/read-messages', methods=['GET'])
def whatsapp_read_messages_api():
    """Reads latest message bubbles from a contact chat."""
    recipient = request.args.get("recipient")
    res = automation_service.read_latest_messages(recipient)
    if isinstance(res, str) and "failure" in res.lower():
        return jsonify({"error": res}), 500
    return jsonify(res)

@app.route('/api/whatsapp/schedule', methods=['POST', 'GET'])
def whatsapp_schedule():
    """Schedules a new WhatsApp message or fetches all scheduled items."""
    if request.method == 'GET':
        schedules = database.get_all_schedules()
        return jsonify(schedules)
    
    elif request.method == 'POST':
        data = request.json or {}
        recipient = data.get("recipient")
        message = data.get("message")
        scheduled_time = data.get("scheduled_time")
        file_path = data.get("file_path")
        
        if not recipient or not message or not scheduled_time:
            return jsonify({"error": "recipient, message, and scheduled_time are required"}), 400
            
        sched_id = database.add_scheduled_message(recipient, message, scheduled_time, file_path)
        return jsonify({"message": "Message scheduled", "id": sched_id})

@app.route('/api/whatsapp/schedule/<int:schedule_id>', methods=['DELETE'])
def whatsapp_schedule_delete(schedule_id):
    """Deletes a scheduled message."""
    database.delete_schedule(schedule_id)
    return jsonify({"message": "Schedule deleted"})

@app.route('/api/whatsapp/contacts', methods=['GET', 'POST'])
def whatsapp_contacts():
    """Retrieves or saves contact nickname mapping."""
    if request.method == 'GET':
        contacts = database.get_all_contacts()
        return jsonify(contacts)
    elif request.method == 'POST':
        data = request.json or {}
        nickname = data.get("nickname")
        contact_name = data.get("contact_name")
        if not nickname or not contact_name:
            return jsonify({"error": "nickname and contact_name are required"}), 400
        database.save_contact(nickname, contact_name)
        return jsonify({"message": "Contact mapping saved"})

@app.route('/api/whatsapp/contacts/<int:contact_id>', methods=['DELETE'])
def whatsapp_contacts_delete(contact_id):
    """Deletes a contact nickname mapping."""
    database.delete_contact(contact_id)
    return jsonify({"message": "Contact mapping deleted"})


# --- AI Web Generator API ---

@app.route('/api/site-gen', methods=['POST'])
def site_gen():
    """Generates website dynamically via direct POST call."""
    data = request.json or {}
    prompt = data.get("prompt")
    site_name = data.get("site_name")
    
    if not prompt or not site_name:
        return jsonify({"error": "Prompt and site_name are required"}), 400
        
    result = site_gen_service.generate_website(prompt, site_name)
    return jsonify(result)

@app.route('/api/site-gen/export', methods=['GET'])
def site_gen_export():
    """Exports generated site as a standalone React+Vite+Tailwind configuration ZIP file."""
    site_name = request.args.get("site_name")
    if not site_name:
        return jsonify({"error": "site_name is required"}), 400
    try:
        zip_data = site_gen_service.export_project_zip(site_name)
        response = make_response(zip_data)
        response.headers.set('Content-Type', 'application/zip')
        response.headers.set('Content-Disposition', 'attachment', filename=f"{site_name}.zip")
        return response
    except Exception as e:
        return jsonify({"error": f"Export failed: {e}"}), 500

@app.route('/api/site-gen/deploy', methods=['POST'])
def site_gen_deploy():
    """Simulates one-click deployment, returning the local web directory hosted URL and an online server URL."""
    data = request.json or {}
    site_name = data.get("site_name")
    if not site_name:
        return jsonify({"error": "site_name is required"}), 400
        
    # We construct a preview URL using Flask's static serve route
    preview_url = f"/generated_sites/{site_name}/index.html"
    
    # We mock a hosted production deployment link for the user
    deployed_domain = f"https://{site_name.replace('_', '-')}-shubham-os.web.app"
    
    return jsonify({
        "status": "deployed",
        "site_name": site_name,
        "preview_url": preview_url,
        "deployed_url": deployed_domain,
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Returns general status information."""
    return jsonify({
        "status": "online",
        "voice_active": voice_service.is_listening,
        "database_connected": True,
        "whatsapp_service": whatsapp_service.get_status(),
        "config_loaded": {
            "openai_enabled": bool(config.OPENAI_API_KEY),
            "elevenlabs_enabled": bool(config.ELEVENLABS_API_KEY)
        }
    })

# Start voice recognition loop automatically on application startup
def start_voice_assistant():
    try:
        voice_service.start_background_thread(voice_chat_callback)
    except Exception as e:
        print(f"Error starting voice engine thread: {e}")

if __name__ == '__main__':
    # Start the voice listening loop in background
    start_voice_assistant()
    # Start the Flask API server
    print(f"[Shubham AI Server] Starting API on http://localhost:{config.PORT}")
    app.run(host='0.0.0.0', port=config.PORT, debug=False)
