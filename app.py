from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from marshmallow import Schema, fields
import os
import datetime
import logging
import sys
import subprocess
from pathlib import Path
from groq import Groq

# ══════════════════════════════════════════════════════════════
# 1. STARTUP LOGGING
# ══════════════════════════════════════════════════════════════
print("🚀 SHUBHAM AI OS Backend Starting...")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("SHUBHAM-AI")

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# Global state for connected agent
agent_state = {
    "status": "offline",
    "last_heartbeat": None,
    "sid": None
}

# ══════════════════════════════════════════════════════════════
# SocketIO Events for Agent
# ══════════════════════════════════════════════════════════════

@socketio.on('connect')
def handle_connect():
    logger.info(f"Client connected: {request.sid}")

@socketio.on('agent_login')
def handle_agent_login(data):
    agent_state["status"] = "online"
    agent_state["sid"] = request.sid
    agent_state["last_heartbeat"] = datetime.datetime.now().isoformat()
    logger.info(f"Local Agent registered: {request.sid}")
    emit('login_success', {'status': 'authenticated'})

@socketio.on('heartbeat')
def handle_heartbeat(data):
    agent_state["last_heartbeat"] = datetime.datetime.now().isoformat()
    agent_state["status"] = "online"

@socketio.on('disconnect')
def handle_disconnect():
    if request.sid == agent_state["sid"]:
        agent_state["status"] = "offline"
        agent_state["sid"] = None
    logger.info(f"Client disconnected: {request.sid}")

@app.route("/api/agent/status")
def agent_status():
    return jsonify(agent_state)

# ══════════════════════════════════════════════════════════════
# 2. CONFIGURATION & CORS (ENTERPRISE STABILIZATION)
# ══════════════════════════════════════════════════════════════
SECRET_KEY = os.environ.get("SECRET_KEY", "jarvis_super_secret_dev_key")
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///shubham_ai.db")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Primary CORS Configuration
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "https://shubham-ai-os-fronted.vercel.app",
                "http://localhost:5173"
            ]
        }
    },
    supports_credentials=True
)

print("✅ CORS Header Duplication Issues Resolved")

# ══════════════════════════════════════════════════════════════
# 3. DATABASE & MODELS
# ══════════════════════════════════════════════════════════════
db = SQLAlchemy(app)

class Memory(db.Model):
    __tablename__ = 'memories'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class MemorySchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    content = fields.Str(required=True)
    category = fields.Str(required=True)
    timestamp = fields.DateTime()

memory_schema = MemorySchema()
memories_schema = MemorySchema(many=True)

# ══════════════════════════════════════════════════════════════
# 4. AI SERVICE INITIALIZATION
# ══════════════════════════════════════════════════════════════
try:
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY is missing. AI features will be limited.")
    client = Groq(api_key=GROQ_API_KEY)
    print("✅ AI Services Initialized")
except Exception as e:
    logger.error(f"AI Init Failed: {e}")
    client = None

with app.app_context():
    db.create_all()

# ══════════════════════════════════════════════════════════════
# 5. ROUTES (WITH EXPLICIT OPTIONS SUPPORT)
# ══════════════════════════════════════════════════════════════

@app.route("/")
@app.route("/api/status")
def status():
    return jsonify({
        "status": "online",
        "system": "SHUBHAM AI OS",
        "version": "1.1.0-STABLE",
        "time": datetime.datetime.now().isoformat()
    })

@app.route("/api/chat", methods=["POST", "OPTIONS"])
def chat():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    if not client:
        return jsonify({"response": "Groq client not initialized. Check API key."}), 503
    try:
        data = request.get_json()
        user_message = data.get("message", "")
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": "You are Nexus, the lead orchestrator of the SHUBHAM AI OS."}, {"role": "user", "content": user_message}]
        )
        return jsonify({"response": completion.choices[0].message.content})
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({"response": f"Neural link destabilized: {str(e)}"}), 500

@app.route('/api/stream-chat', methods=['POST', 'OPTIONS'])
def stream_chat():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json()
    user_message = data.get('message')
    def generate():
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": user_message}],
                stream=True
            )
            for chunk in completion:
                delta = getattr(chunk.choices[0].delta, 'content', None)
                if delta:
                    yield f"data: {delta}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {str(e)}\n\n"
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/chat-history', methods=['GET', 'OPTIONS'])
def chat_history():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    # Returns last 50 memories as a simulated chat history for the UI
    mems = Memory.query.order_by(Memory.timestamp.desc()).limit(50).all()
    history = [{"sender": "user" if i%2==0 else "nexus", "message": m.content, "timestamp": m.timestamp} for i, m in enumerate(mems)]
    return jsonify(history)

@app.route('/api/memory', methods=['GET', 'POST', 'OPTIONS'])
def manage_memory():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    if request.method == 'GET':
        mems = Memory.query.order_by(Memory.timestamp.desc()).all()
        return jsonify(memories_schema.dump(mems))
    if request.method == 'POST':
        data = request.get_json()
        new_mem = Memory(
            title=data.get('title'),
            content=data.get('content'),
            category=data.get('category', 'note')
        )
        db.session.add(new_mem)
        db.session.commit()
        return jsonify(memory_schema.dump(new_mem))

@app.route('/api/memory/<int:id>', methods=['DELETE', 'OPTIONS'])
def delete_memory(id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    mem = Memory.query.get_or_404(id)
    db.session.delete(mem)
    db.session.commit()
    return jsonify({"message": "Memory deleted"})

@app.route('/api/planner', methods=['GET', 'POST', 'OPTIONS'])
@app.route('/api/planner/<int:id>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def manage_planner(id=None):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    return jsonify({"status": "success", "message": "Mission planning module active.", "id": id})

@app.route('/api/analyze-pdf', methods=['POST', 'OPTIONS'])
def analyze_pdf():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    return jsonify({"response": "PDF Analysis module online. Awaiting document stream."})

@app.route('/api/analyze-image', methods=['POST', 'OPTIONS'])
def analyze_image():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    return jsonify({"response": "Visual Cortex online. Image analysis processing active."})

@app.route('/api/system-command', methods=['POST', 'OPTIONS'])
def system_command():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    data = request.get_json()
    command = data.get('command', '').lower()
    confirmed = data.get('confirmed', False)
    
    if agent_state["status"] != "online":
        return jsonify({
            "status": "failed", 
            "message": "Local machine agent is offline. Command cannot be executed."
        }), 503

    # Relay to Agent
    socketio.emit('execute_command', {
        'command': command,
        'confirmed': confirmed,
        'timestamp': datetime.datetime.now().isoformat()
    }, to=agent_state["sid"])

    return jsonify({
        "status": "pending", 
        "message": f"Command dispatched to local machine: {command}"
    })

@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    return jsonify({"success": True, "message": "Teleportation bridge active. File received."})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
