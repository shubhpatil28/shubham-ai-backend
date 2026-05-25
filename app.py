from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)

# Enable CORS
CORS(app)

# Home route
@app.route("/")
def home():
    return jsonify({
        "status": "Backend Running 🚀"
    })

# Chat route
@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()

    user_message = data.get("message", "")

    return jsonify({
        "response": f"AI Response: {user_message}"
    })

# Run server
if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )
