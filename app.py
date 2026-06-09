from flask import Flask, request, jsonify, Response, current_app
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit
from marshmallow import Schema, fields
import os, json
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

# Allowed origins for both HTTP and WebSocket
ALLOWED_ORIGINS = [
    "https://shubham-ai-os-fronted.vercel.app",
    "https://shubham-ai-os-frontend.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
]

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=True,
    engineio_logger=True,
    allow_upgrades=True,
    ping_timeout=120,
    ping_interval=25
)

# Robust state for connected agents
active_agents = {}
sid_to_agent = {}

# ══════════════════════════════════════════════════════════════
# SocketIO Events for Agent
# ══════════════════════════════════════════════════════════════

@socketio.on('connect')
def handle_connect():
    logger.info(f"CLIENT_CONNECTED: sid={request.sid}")

@socketio.on('agent_login')
def handle_agent_login(data):
    agent_id = data.get("device_id", "unknown_agent")
    active_agents[agent_id] = {
        "sid": request.sid,
        "status": "online",
        "last_heartbeat": datetime.datetime.now().isoformat(),
        "platform": data.get("platform"),
        "device_id": agent_id
    }
    # Store SID mapping separately to keep active_agents registry clean
    sid_to_agent[request.sid] = agent_id
    
    print("AGENT_LOGIN_RECEIVED", request.sid, data)
    print("ACTIVE_AGENTS_AFTER_LOGIN", active_agents)
    
    logger.info(f"AGENT_LOGIN_RECEIVED: sid={request.sid} data={data}")
    logger.info(f"ACTIVE_AGENTS_AFTER_LOGIN: {active_agents}")
    
    logger.info(f"AGENT_REGISTERED: agent_id={agent_id} sid={request.sid}")
    emit('login_success', {'status': 'authenticated'})

@socketio.on('heartbeat')
def handle_heartbeat(data):
    agent_id = sid_to_agent.get(request.sid)
    if agent_id and agent_id in active_agents:
        active_agents[agent_id]["last_heartbeat"] = datetime.datetime.now().isoformat()
        active_agents[agent_id]["status"] = "online"
        print("HEARTBEAT_RECEIVED", request.sid)
        logger.info(f"HEARTBEAT_RECEIVED: sid={request.sid} agent_id={agent_id}")
        logger.info(f"AGENT_HEARTBEAT: agent_id={agent_id}")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    agent_id = sid_to_agent.pop(sid, None)
    if agent_id and agent_id in active_agents:
        # Only remove the agent if the disconnecting SID is the CURRENT one for that agent
        if active_agents[agent_id].get("sid") == sid:
            active_agents.pop(agent_id)
            print("DISCONNECT_RECEIVED", request.sid)
            print("ACTIVE_AGENTS_AFTER_DISCONNECT", active_agents)
            logger.info(f"AGENT_DISCONNECTED: sid={sid} agent_id={agent_id}")
            logger.info(f"ACTIVE_AGENTS_AFTER_DISCONNECT: {active_agents}")
        else:
            logger.info(f"STALE_DISCONNECT_IGNORED: agent_id={agent_id} sid={sid}")
    logger.info(f"CLIENT_DISCONNECTED: sid={sid}")

@app.route("/api/agent/status")
def agent_status():
    print("AGENT_STATUS_CALLED", active_agents)
    # Diagnostic payload
    all_agents = [v for v in active_agents.values() if isinstance(v, dict)]
    is_connected = len(all_agents) > 0
    
    diagnostic = {
        "worker_pid": os.getpid(),
        "connected": is_connected,
        "agents_count": len(all_agents),
        "agents": all_agents,
        "timestamp": datetime.datetime.now().isoformat()
    }
    logger.info(f"/api/agent/status accessed – pid={os.getpid()}, connected={is_connected}")
    return jsonify(diagnostic)

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
# Set supports_credentials=False for cross-origin compatibility without cookies
CORS(
    app,
    resources={
        r"/*": {
            "origins": ALLOWED_ORIGINS
        }
    },
    supports_credentials=False
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

class PlannerTask(db.Model):
    __tablename__ = 'planner_tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    status = db.Column(db.String(20), default='pending')          # pending | completed
    priority = db.Column(db.String(20), default='medium')         # low | medium | high
    scheduled_time = db.Column(db.String(10), nullable=True)      # HH:MM or null
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class MemorySchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    content = fields.Str(required=True)
    category = fields.Str(required=True)
    timestamp = fields.DateTime()

memory_schema = MemorySchema()
memories_schema = MemorySchema(many=True)

def task_to_dict(t):
    return {
        "id": t.id,
        "title": t.title,
        "status": t.status,
        "priority": t.priority,
        "scheduled_time": t.scheduled_time,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }

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
    print("✅ Database tables created (including planner_tasks)")

# ══════════════════════════════════════════════════════════════
# 5. ROUTES (WITH EXPLICIT OPTIONS SUPPORT)
# ══════════════════════════════════════════════════════════════

@app.route("/")
@app.route("/api/status")
def status():
    return jsonify({
        "status": "online",
        "system": "SHUBHAM AI OS",
        "version": "4.0.1-STABLE-2026-06-09",
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
    try:
        # Returns last 50 memories as a simulated chat history for the UI
        mems = Memory.query.order_by(Memory.timestamp.desc()).limit(50).all()
        history = [{"sender": "user" if i%2==0 else "nexus", "message": m.content, "timestamp": m.timestamp} for i, m in enumerate(mems)]
        return jsonify(history)
    except Exception as e:
        logger.exception("Chat history error")
        return jsonify({"error": str(e)}), 500

@app.route('/api/memory', methods=['GET', 'POST', 'OPTIONS'])
def manage_memory():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    try:
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
    except Exception as e:
        logger.exception("Memory management error")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/memory/<int:id>', methods=['DELETE', 'OPTIONS'])
def delete_memory(id):
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    try:
        mem = Memory.query.get_or_404(id)
        db.session.delete(mem)
        db.session.commit()
        return jsonify({"message": "Memory deleted"})
    except Exception as e:
        logger.exception("Memory deletion error")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/planner', methods=['GET', 'POST', 'OPTIONS'])
def planner_list():
    """GET → return task array, POST → create a task."""
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        if request.method == 'GET':
            tasks = PlannerTask.query.order_by(PlannerTask.created_at.desc()).all()
            return jsonify([task_to_dict(t) for t in tasks])

        # POST — create task
        data = request.get_json(force=True)
        title = (data.get('title') or '').strip()
        if not title:
            return jsonify({"error": "Title is required"}), 400

        new_task = PlannerTask(
            title=title,
            priority=data.get('priority', 'medium'),
            scheduled_time=data.get('time'),
        )
        db.session.add(new_task)
        db.session.commit()
        return jsonify(task_to_dict(new_task)), 201

    except Exception as e:
        logger.exception("Planner list/create error")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/planner/<int:id>', methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
def planner_detail(id):
    """GET → single task, PUT → update, DELETE → remove."""
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        task = PlannerTask.query.get(id)
        if not task:
            return jsonify({"error": "Task not found"}), 404

        if request.method == 'GET':
            return jsonify(task_to_dict(task))

        if request.method == 'PUT':
            data = request.get_json(force=True)
            if 'title' in data:
                task.title = data['title']
            if 'status' in data:
                task.status = data['status']
            if 'priority' in data:
                task.priority = data['priority']
            if 'time' in data:
                task.scheduled_time = data['time']
            db.session.commit()
            return jsonify(task_to_dict(task))

        if request.method == 'DELETE':
            db.session.delete(task)
            db.session.commit()
            return jsonify({"message": "Task deleted"})

    except Exception as e:
        logger.exception("Planner detail error")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

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
        
    try:
        data = request.get_json()
        command = data.get('command', '').lower()
        confirmed = data.get('confirmed', False)
        
        logger.info("SYSTEM_COMMAND_RECEIVED", command)
        
        # Get first available online agent
        online_agents = [v for v in active_agents.values() if isinstance(v, dict) and v.get("status") == "online"]
        target_agent = online_agents[0] if online_agents else None
        connected = target_agent is not None
        logger.info("LOCAL_AGENT_CONNECTED", connected)
        
        if not connected:
            return jsonify({
                "success": False,
                "error": "LOCAL_AGENT_OFFLINE",
                "message": "Local machine agent is offline. Command cannot be executed."
            }), 200

        # Relay to Agent
        socketio.emit('execute_command', {
            'command': command,
            'confirmed': confirmed,
            'timestamp': datetime.datetime.now().isoformat()
        }, room=target_agent["sid"], namespace='/')

        logger.info("COMMAND_DISPATCHED", command)
        return jsonify({
            "success": True,
            "status": "queued",
            "message": f"Command dispatched to local machine: {command}"
        })

    except Exception as e:
        logger.exception("SYSTEM_COMMAND_ROUTE_EXCEPTION")
        return jsonify({
            "success": False,
            "error": "INTERNAL_SERVER_ERROR",
            "message": str(e)
        }), 500

@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
    return jsonify({"success": True, "message": "Teleportation bridge active. File received."})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
