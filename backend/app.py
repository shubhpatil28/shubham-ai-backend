import os

from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

@app.route("/")
def index():
    return jsonify({"message": "Shubham OS backend is running."})

@app.route("/api/status")
def get_status():
    return jsonify({"status": "online"})

@socketio.on("connect")
def handle_connect():
    print("[SocketIO] Client connected.")

@socketio.on("disconnect")
def handle_disconnect():
    print("[SocketIO] Client disconnected.")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port)
