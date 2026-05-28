from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from marshmallow import Schema, fields
import os
import datetime
import logging
import sys
from groq import Groq

# ══════════════════════════════════════════════════════════════
# 1. STARTUP LOGGING & CONFIGURATION
# ══════════════════════════════════════════════════════════════
print("🚀 SHUBHAM AI OS Backend Starting...")

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("SHUBHAM-AI-OS")

app = Flask(__name__)
CORS(app)

# ══════════════════════════════════════════════════════════════
# 2. ENVIRONMENT VARIABLES & SAFETY GUARDS
# ══════════════════════════════════════════════════════════════
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
SECRET_KEY = os.environ.get("SECRET_KEY", "jarvis_super_secret_dev_key")
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///shubham_ai.db")

if not GROQ_API_KEY:
    logger.warning("⚠️ GROQ_API_KEY not found in environment. AI features will fail.")

app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ══════════════════════════════════════════════════════════════
# 3. DATABASE & MODELS (Memory Vault)
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
# 4. AI SERVICE INITIALIZATION (Groq)
# ══════════════════════════════════════════════════════════════
try:
    client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
    print("✅ AI Services Initialized (Groq)")
except Exception as e:
    logger.error(f"❌ Failed to initialize Groq: {e}")
    client = None

# Ensure tables are created
with app.app_context():
    try:
        db.create_all()
        print("✅ Database Tables Initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")

# ══════════════════════════════════════════════════════════════
# 5. API ENDPOINTS
# ══════════════════════════════════════════════════════════════

@app.route("/")
@app.route("/api/status")
def status():
    return jsonify({
        "status": "online",
        "system": "SHUBHAM AI OS",
        "version": "3.5.0-PROD",
        "timestamp": datetime.datetime.now().isoformat(),
        "features": ["Groq", "MemoryVault", "Streaming-SSE"]
    })

@app.route("/api/chat", methods=["POST"])
def chat():
    if not client:
        return jsonify({"response": "AI Service unavailable. Check API Key."}), 503
    
    try:
        data = request.get_json()
        user_message = data.get("message", "")
        if not user_message:
            return jsonify({"response": "Please say something, buddy! 😄"}), 400

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": user_message}]
        )
        ai_text = completion.choices[0].message.content
        return jsonify({"response": ai_text})

    except Exception as e:
        logger.error(f"Chat Error: {e}")
        return jsonify({"response": f"System error: {str(e)}"}), 500

@app.route('/api/stream-chat', methods=['POST'])
def stream_chat():
    if not client:
        return jsonify({'error': 'AI Service unavailable'}), 503
        
    data = request.get_json()
    user_message = data.get('message')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

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
            logger.error(f"Streaming Error: {e}")
            yield f"event: error\ndata: {str(e)}\n\n"
            
    return Response(generate(), mimetype='text/event-stream')

# Memory Vault CRUD
@app.route('/api/memory', methods=['GET'])
def get_memories():
    memories = Memory.query.order_by(Memory.timestamp.desc()).all()
    return jsonify(memories_schema.dump(memories))

@app.route('/api/memory', methods=['POST'])
def create_memory():
    try:
        data = request.get_json()
        mem = Memory(
            title=data.get('title'),
            content=data.get('content'),
            category=data.get('category', 'general')
        )
        db.session.add(mem)
        db.session.commit()
        return jsonify(memory_schema.dump(mem)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/memory/<int:mem_id>', methods=['DELETE'])
def delete_memory(mem_id):
    mem = Memory.query.get_or_404(mem_id)
    db.session.delete(mem)
    db.session.commit()
    return jsonify({'message': 'Memory deleted'}), 200

# ══════════════════════════════════════════════════════════════
# 6. FINAL EXPORT & RUNNER
# ══════════════════════════════════════════════════════════════
print("✅ Flask App Loaded Successfully")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
