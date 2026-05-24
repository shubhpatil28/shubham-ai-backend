"""
🧭 Shubham AI — Intelligent Command Router
=============================================
Classifies every user input into one of the following modes:

  1. CHAT        → General conversation, greetings, feelings, jokes
  2. EXECUTE     → Desktop automation, app launch, system controls
  3. CODE_HELP   → Programming questions, debugging, code generation
  4. SITE_BUILD  → Website/app generation, design prompts
  5. MEMORY      → Remember / recall / forget / search memories
  6. WHATSAPP    → Send messages, schedule, upload status, read chats

Architecture:
  ┌──────────────┐
  │  User Input  │
  └──────┬───────┘
         │
  ┌──────▼───────────────────────┐
  │  Rule-Based Keyword Scorer   │  ← fast, offline, handles Marathi + English
  │  (weighted pattern matching) │
  └──────┬───────────────────────┘
         │
  ┌──────▼───────────────────────┐
  │  Confidence Threshold Gate   │  ← ensures ambiguous inputs still route correctly
  └──────┬───────────────────────┘
         │
  ┌──────▼───────────────────────┐
  │  Returns: (mode, confidence, │
  │           metadata)          │
  └──────────────────────────────┘

Pure Python — no external ML dependencies needed.
Supports Marathi + English (Marathish) mixed inputs naturally.
"""

import re
from collections import defaultdict


# ============================================================
# Route Modes
# ============================================================

class RouteMode:
    CHAT       = "chat"
    EXECUTE    = "execute"
    CODE_HELP  = "code_help"
    SITE_BUILD = "site_build"
    MEMORY     = "memory"
    WHATSAPP   = "whatsapp"

    ALL_MODES = [CHAT, EXECUTE, CODE_HELP, SITE_BUILD, MEMORY, WHATSAPP]


# ============================================================
# Weighted Keyword/Pattern Definitions
# ============================================================

# Each entry: (pattern_regex, weight)
# Higher weight = stronger signal for that mode

ROUTE_PATTERNS = {
    RouteMode.EXECUTE: [
        # App launch commands
        (r"\b(open|launch|start|run|close|kill|ughadh|band kar|chalu kar)\b", 3.0),
        (r"\b(notepad|calculator|chrome|browser|explorer|vscode|terminal|cmd|powershell)\b", 3.5),
        (r"\b(volume|brightness|screenshot|shutdown|restart|lock|sleep|wifi|bluetooth)\b", 3.0),
        (r"\b(screen|display|wallpaper|taskbar|desktop)\b", 2.0),
        # Marathi automation verbs
        (r"\b(ughadh|band|chalu|bund|kapat)\b", 2.5),
        # System file operations
        (r"\b(file|folder|directory|create|delete|rename|move|copy)\b", 1.5),
        (r"\b(app|application|software|program)\b", 1.5),
    ],

    RouteMode.SITE_BUILD: [
        # Website generation triggers
        (r"\b(website|webpage|site|landing\s*page|portfolio|web\s*app)\b", 3.5),
        (r"\b(banav|bana|generate|create|design|build)\b.*\b(website|site|page|web)\b", 5.0),
        (r"\b(website|site|page|web)\b.*\b(banav|bana|generate|create|design|build)\b", 5.0),
        (r"\b(html|css|react|tailwind|frontend|layout|template|responsive)\b.*\b(banav|bana|generate|create)\b", 4.0),
        (r"\b(deploy|host|publish)\b.*\b(site|website|page)\b", 3.5),
        # Design-specific
        (r"\b(hero\s*section|navbar|footer|card|grid|flexbox)\b", 2.0),
        (r"\b(glassmorphism|gradient|dark\s*mode|animation|parallax)\b.*\b(website|site|page)\b", 3.0),
    ],

    RouteMode.CODE_HELP: [
        # Programming keywords
        (r"\b(code|coding|program|debug|error|bug|fix|compile|syntax)\b", 3.0),
        (r"\b(function|class|method|variable|loop|array|object|api|endpoint)\b", 2.5),
        (r"\b(python|javascript|java|dart|flutter|react|node|express|flask|django)\b", 2.0),
        (r"\b(algorithm|data\s*structure|recursion|sort|search|tree|graph|stack|queue)\b", 3.0),
        # Code help patterns
        (r"\b(how\s+to|explain|what\s+is|difference\s+between)\b.*\b(code|function|class|method|api)\b", 3.5),
        (r"\b(write|create|implement|build)\b.*\b(function|class|api|script|module)\b", 3.0),
        (r"\b(error|exception|traceback|stacktrace|undefined|null|NaN)\b", 2.5),
        # Hindi/Marathi code queries
        (r"\b(code|script|program)\b.*\b(lih|lihi|kar|banav)\b", 3.0),
        (r"\b(samjav|samja|explain kar)\b.*\b(code|logic|algorithm)\b", 3.0),
        (r"\b(git|github|commit|push|pull|merge|branch|repo)\b", 2.0),
    ],

    RouteMode.MEMORY: [
        # Remember / Recall / Forget
        (r"\b(remember|lakshat\s*thev|sathav|store|save|yaad\s*rakh)\b", 4.0),
        (r"\b(forget|visar|delete\s*memory|remove\s*memory|hata)\b", 4.0),
        (r"\b(recall|search\s*memory|check\s*memory|what.*my\s*(goal|routine|project|idea))\b", 3.5),
        (r"\b(memory|memories|brain|lakshat)\b", 2.5),
        (r"\b(my\s*(goal|project|routine|contact|idea|preference|style))\b", 3.0),
        (r"\b(tuze|maza|majha|my)\b.*\b(goal|udyog|dhyey|plan|idea)\b", 3.0),
        # Insights
        (r"\b(insights|analytics|summary|statistics|stats)\b.*\b(memory|brain)\b", 3.5),
        (r"\b(export|import|backup|restore)\b.*\b(memory|json|data)\b", 3.5),
    ],

    RouteMode.WHATSAPP: [
        # Sending messages
        (r"\b(whatsapp|message|msg|text|pathav|send)\b", 2.5),
        (r"\b(send|pathav)\b.*\b(message|msg|text)\b", 4.0),
        (r"\b(la|ला|को)\b.*\b(pathav|send|message)\b", 3.5),
        (r"\b(message|msg)\b.*\b(kar|send|pathav)\b", 3.5),
        # Scheduling
        (r"\b(schedule|cron|natar|later)\b.*\b(message|send|pathav)\b", 4.0),
        # Status
        (r"\b(status)\b.*\b(upload|lav|tak|post|update)\b", 3.5),
        # Reading messages
        (r"\b(read|vach)\b.*\b(message|chat|msg)\b", 3.5),
        # Contacts
        (r"\b(contact|nickname|mapping)\b.*\b(add|save|delete|remove)\b", 3.0),
        (r"\b(call\s*kar|chat\s*open)\b", 3.0),
    ],

    RouteMode.CHAT: [
        # Greetings
        (r"\b(hello|hi|hey|namaste|namaskar|suprabhat|shubh\s*ratri)\b", 2.5),
        (r"\b(kasa\s*ahes|kashi\s*ahe|kasa\s*challa|how\s*are\s*you|what'?s\s*up)\b", 3.5),
        (r"\b(good\s*morning|good\s*night|good\s*evening|good\s*afternoon)\b", 2.5),
        # Personal/emotional
        (r"\b(feel|feeling|mood|happy|sad|bore|bored|tired|angry|excited|anxious)\b", 3.0),
        (r"\b(tu\s*kasa|tula|mala|bhuk|jhop|thanks|dhanyawad|aabhar)\b", 3.0),
        # Opinion/jokes
        (r"\b(joke|funny|hasv|hasa|mazak|masti)\b", 2.5),
        (r"\b(who\s*are\s*you|what\s*can\s*you\s*do|help\s*me|mala\s*sang)\b", 2.5),
        (r"\b(tell\s*me|sang\s*na|bol\s*na|gappa|chat)\b", 2.5),
        # Generic filler / conversational
        (r"\b(okay|ok|hmm|haan|ho|nahi|accha|thik|bara)\b", 1.0),
        # Questions without technical context
        (r"^(kay|what|why|how|where|when|who)\b", 0.5),
    ],
}


# ============================================================
# Negative Signals (reduce score for a mode)
# ============================================================

NEGATIVE_PATTERNS = {
    RouteMode.SITE_BUILD: [
        # If they mention "website" but in a code/debug context, reduce site_build score
        (r"\b(debug|error|fix|broken)\b.*\b(website|site)\b", -2.0),
    ],
    RouteMode.CODE_HELP: [
        # "open chrome" shouldn't trigger code_help even though chrome is a tech term
        (r"\b(open|launch|start|close|band)\b.*\b(chrome|browser)\b", -3.0),
    ],
    RouteMode.CHAT: [
        # If strong action verbs present, deprioritize chat
        (r"\b(open|launch|start|banav|bana|generate|send|pathav|remember|lakshat)\b", -2.0),
    ],
}


# ============================================================
# Command Router Engine
# ============================================================

class CommandRouter:
    """
    🧭 Intelligent Command Router for Shubham AI.
    Classifies user input into the appropriate processing pipeline.
    """

    def __init__(self):
        self._compiled_patterns = {}
        self._compiled_negatives = {}

        # Pre-compile all regex patterns for performance
        for mode, patterns in ROUTE_PATTERNS.items():
            self._compiled_patterns[mode] = [
                (re.compile(pattern, re.IGNORECASE), weight)
                for pattern, weight in patterns
            ]

        for mode, patterns in NEGATIVE_PATTERNS.items():
            self._compiled_negatives[mode] = [
                (re.compile(pattern, re.IGNORECASE), weight)
                for pattern, weight in patterns
            ]

        print("[CommandRouter] Initialized with pattern-based classification engine.")

    def classify(self, user_input):
        """
        Classify user input into a route mode.
        
        Returns:
            dict: {
                "mode": str,           # The classified mode (chat/execute/code_help/site_build/memory/whatsapp)
                "confidence": float,   # 0.0 to 1.0 confidence score
                "scores": dict,        # Raw scores for all modes (for debugging)
                "metadata": dict       # Extracted entities (app_name, recipient, query, etc.)
            }
        """
        text = user_input.strip()
        if not text:
            return self._build_result(RouteMode.CHAT, 1.0, {}, {})

        scores = defaultdict(float)

        # 1. Score each mode using positive patterns
        for mode, compiled_list in self._compiled_patterns.items():
            for pattern, weight in compiled_list:
                matches = pattern.findall(text)
                if matches:
                    scores[mode] += weight * len(matches)

        # 2. Apply negative patterns (deductions)
        for mode, compiled_list in self._compiled_negatives.items():
            for pattern, weight in compiled_list:
                matches = pattern.findall(text)
                if matches:
                    scores[mode] += weight * len(matches)  # weight is already negative

        # 3. Apply length heuristic: very short inputs with no strong signals → chat
        word_count = len(text.split())
        if word_count <= 3 and max(scores.values(), default=0) < 2.0:
            scores[RouteMode.CHAT] += 2.0

        # 4. Determine winner
        raw_scores = dict(scores)
        
        if not scores or max(scores.values()) <= 0:
            # No patterns matched at all → default to chat
            return self._build_result(RouteMode.CHAT, 0.5, raw_scores, self._extract_metadata(text, RouteMode.CHAT))

        # Find max-scoring mode
        best_mode = max(scores, key=scores.get)
        best_score = scores[best_mode]

        # Calculate confidence (normalize by sum of all positive scores)
        total_positive = sum(max(0, s) for s in scores.values())
        confidence = round(best_score / total_positive, 3) if total_positive > 0 else 0.5

        # Minimum confidence floor
        confidence = max(confidence, 0.3)

        # Extract relevant metadata
        metadata = self._extract_metadata(text, best_mode)

        return self._build_result(best_mode, confidence, raw_scores, metadata)

    def _build_result(self, mode, confidence, scores, metadata):
        """Build standardized result dict."""
        return {
            "mode": mode,
            "confidence": round(confidence, 3),
            "scores": {k: round(v, 2) for k, v in scores.items()},
            "metadata": metadata,
        }

    def _extract_metadata(self, text, mode):
        """Extract relevant entities based on detected mode."""
        metadata = {}
        text_lower = text.lower()

        if mode == RouteMode.EXECUTE:
            # Try to extract app name
            app_patterns = {
                "notepad":    r"\b(notepad)\b",
                "calculator": r"\b(calculator|calc)\b",
                "chrome":     r"\b(chrome|browser)\b",
                "explorer":   r"\b(explorer|files|file\s*manager)\b",
                "vscode":     r"\b(vscode|vs\s*code|visual\s*studio)\b",
                "terminal":   r"\b(terminal|cmd|powershell|command\s*prompt)\b",
            }
            for app_name, pattern in app_patterns.items():
                if re.search(pattern, text_lower):
                    metadata["app_name"] = app_name
                    break
            
            # Detect action type
            if re.search(r"\b(close|band|kill|bund)\b", text_lower):
                metadata["action"] = "close"
            elif re.search(r"\b(open|launch|start|ughadh|chalu)\b", text_lower):
                metadata["action"] = "open"

        elif mode == RouteMode.SITE_BUILD:
            # Extract site description prompt
            # Remove trigger words to get the design prompt
            prompt = text
            for trigger in ["website banav", "website bana", "site banav", "generate website",
                           "site generate kar", "webpage bana", "webpage banav",
                           "website generate", "build website", "create website",
                           "create site", "design website"]:
                prompt = re.sub(re.escape(trigger), "", prompt, flags=re.IGNORECASE).strip()
            metadata["design_prompt"] = prompt or text
            # Auto-generate site name
            clean_words = re.findall(r'[a-zA-Z]+', prompt.lower())
            metadata["site_name"] = "_".join(clean_words[:3]) if clean_words else "ai_website"

        elif mode == RouteMode.CODE_HELP:
            # Detect language context
            lang_patterns = {
                "python": r"\b(python|py|flask|django|pip)\b",
                "javascript": r"\b(javascript|js|node|npm|react|vue|next)\b",
                "dart": r"\b(dart|flutter)\b",
                "java": r"\b(java|spring|maven)\b",
                "html_css": r"\b(html|css|tailwind|bootstrap)\b",
            }
            for lang, pattern in lang_patterns.items():
                if re.search(pattern, text_lower):
                    metadata["language"] = lang
                    break

        elif mode == RouteMode.WHATSAPP:
            # Try to extract recipient
            for sep in [" la ", " ला ", " को ", " to "]:
                if sep in text_lower:
                    parts = text_lower.split(sep, 1)
                    # Recipient is usually the last word before the separator
                    words_before = parts[0].strip().split()
                    if words_before:
                        metadata["recipient"] = words_before[-1]
                    # Message is after separator, cleaned
                    msg_part = parts[1].strip()
                    for tw in ["send kar", "message kar", "pathav", "send", "message"]:
                        msg_part = msg_part.replace(tw, "").strip()
                    if msg_part:
                        metadata["message"] = msg_part
                    break

        elif mode == RouteMode.MEMORY:
            # Detect memory sub-action
            if re.search(r"\b(remember|lakshat\s*thev|sathav|store|save|yaad)\b", text_lower):
                metadata["memory_action"] = "save"
            elif re.search(r"\b(forget|visar|delete|remove|hata)\b", text_lower):
                metadata["memory_action"] = "forget"
            elif re.search(r"\b(export|backup)\b", text_lower):
                metadata["memory_action"] = "export"
            elif re.search(r"\b(import|restore)\b", text_lower):
                metadata["memory_action"] = "import"
            else:
                metadata["memory_action"] = "recall"

        return metadata

    def get_mode_label(self, mode):
        """Return a human-friendly label for the mode."""
        labels = {
            RouteMode.CHAT:       "💬 Chat Mode — General conversation",
            RouteMode.EXECUTE:    "⚡ Execute Mode — Desktop automation",
            RouteMode.CODE_HELP:  "💻 Code Help Mode — Programming assistance",
            RouteMode.SITE_BUILD: "🌐 Site Builder Mode — Website generation",
            RouteMode.MEMORY:     "🧠 Memory Mode — Remember/recall/forget",
            RouteMode.WHATSAPP:   "📱 WhatsApp Mode — Messaging automation",
        }
        return labels.get(mode, f"❓ Unknown Mode: {mode}")

    def get_mode_emoji(self, mode):
        """Return an emoji indicator for the mode."""
        emojis = {
            RouteMode.CHAT:       "💬",
            RouteMode.EXECUTE:    "⚡",
            RouteMode.CODE_HELP:  "💻",
            RouteMode.SITE_BUILD: "🌐",
            RouteMode.MEMORY:     "🧠",
            RouteMode.WHATSAPP:   "📱",
        }
        return emojis.get(mode, "❓")


# ============================================================
# Singleton
# ============================================================

_router_instance = None

def get_command_router():
    """Get or create the global CommandRouter singleton."""
    global _router_instance
    if _router_instance is None:
        _router_instance = CommandRouter()
    return _router_instance
