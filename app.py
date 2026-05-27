from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from groq import Groq
import os

app = Flask(__name__)

CORS(app)

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY")
)

@app.route("/")
def home():
    return jsonify({
        "status": "SHUBHAM AI Backend Running 🚀"
    })

@app.route("/chat", methods=["POST"])
def chat():

    try:

        data = request.get_json()

        user_message = data["message"]

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        )

        ai_text = completion.choices[0].message.content

        return jsonify({
            "response": ai_text
        })

    except Exception as e:

        return jsonify({
            "response": f"Error: {str(e)}"
        })

from flask_sqlalchemy import SQLAlchemy
from marshmallow import Schema, fields
import datetime

# Initialize SQLAlchemy with SQLite database
app.config['SQLALCHEMY_DATABASE_URI'] = os.path.join(os.getcwd(), 'memory.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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

# Ensure tables are created
with app.app_context():
    db.create_all()

@app.route('/api/stream-chat', methods=['POST'])
def stream_chat():
    """SSE endpoint that streams Groq response token‑by‑token.
    Expects JSON payload: {"message": "user prompt"}
    """
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
                # Each chunk may contain .choices[0].delta.content
                delta = getattr(chunk.choices[0].delta, 'content', None)
                if delta:
                    yield f"data: {delta}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {str(e)}\n\n"
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/memory', methods=['GET'])
def get_memories():
    # Optional query params: category, search
    category = request.args.get('category')
    search = request.args.get('q')
    query = Memory.query
    if category:
        query = query.filter(Memory.category == category)
    if search:
        pattern = f"%{search}%"
        query = query.filter(Memory.title.ilike(pattern) | Memory.content.ilike(pattern))
    memories = query.order_by(Memory.timestamp.desc()).all()
    return jsonify(memories_schema.dump(memories))

@app.route('/api/memory', methods=['POST'])
def create_memory():
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    category = data.get('category')
    if not all([title, content, category]):
        return jsonify({'error': 'Missing fields'}), 400
    mem = Memory(title=title, content=content, category=category)
    db.session.add(mem)
    db.session.commit()
    return jsonify(memory_schema.dump(mem)), 201

@app.route('/api/memory/<int:mem_id>', methods=['PUT'])
def update_memory(mem_id):
    mem = Memory.query.get_or_404(mem_id)
    data = request.get_json()
    mem.title = data.get('title', mem.title)
    mem.content = data.get('content', mem.content)
    mem.category = data.get('category', mem.category)
    db.session.commit()
    return jsonify(memory_schema.dump(mem))

@app.route('/api/memory/<int:mem_id>', methods=['DELETE'])
def delete_memory(mem_id):
    mem = Memory.query.get_or_404(mem_id)
    db.session.delete(mem)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )
