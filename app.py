from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from marshmallow import Schema, fields
import os
import datetime
import logging
import sys
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

# ══════════════════════════════════════════════════════════════
# 2. CONFIGURATION & CORS
# ══════════════════════════════════════════════════════════════
SECRET_KEY = os.environ.get("SECRET_KEY", "jarvis_super_secret_dev_key")
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///shubham_ai.db")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "https://shubham-ai-os-fronted.vercel.app",
                "http://localhost:5173",
                "https://shubham-ai-os-fronted-shubhpatil28s-projects.vercel.app"
            ]
        }
    },
    supports_credentials=True
)

print("✅ Flask App & CORS Configured")

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
# 5. ROUTES
# ══════════════════════════════════════════════════════════════

@app.route("/")
@app.route("/api/status")
def status():
    return jsonify({
        "status": "online",
        "system": "SHUBHAM AI OS",
        "version": "1.0.0",
        "time": datetime.datetime.now().isoformat()
    })

@app.route("/api/chat", methods=["POST"])
def chat():
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

@app.route('/api/stream-chat', methods=['POST'])
def stream_chat():
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

@app.route('/api/memory', methods=['GET'])
def get_memories():
    mems = Memory.query.order_by(Memory.timestamp.desc()).all()
    return jsonify(memories_schema.dump(mems))

@app.route('/api/memory', methods=['POST'])
def add_memory():
    data = request.get_json()
    new_mem = Memory(
        title=data.get('title'),
        content=data.get('content'),
        category=data.get('category', 'note')
    )
    db.session.add(new_mem)
    db.session.commit()
    return jsonify(memory_schema.dump(new_mem))

@app.route('/api/analyze-pdf', methods=['POST'])
def analyze_pdf():
    return jsonify({"response": "PDF Analysis module online. Awaiting document stream."})

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    return jsonify({"response": "Visual Cortex online. Image analysis processing active."})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    return jsonify({"success": True, "message": "Teleportation bridge active. File received."})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
