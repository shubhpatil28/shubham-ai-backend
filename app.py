from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os

app = Flask(__name__)

# Enable CORS
CORS(app)

# Gemini API Setup
genai.configure(
    api_key=os.environ.get("GEMINI_API_KEY")
)

# Load Gemini Model
model = genai.GenerativeModel("gemini-1.5-flash")

# Home Route
@app.route("/")
def home():
    return jsonify({
        "status": "SHUBHAM AI Backend Running 🚀"
    })

# Chat Route
@app.route("/chat", methods=["POST"])
def chat():

    try:

        # Get frontend message
        data = request.get_json()

        user_message = data.get("message", "")

        # Send to Gemini
        response = model.generate_content(user_message)

        # Extract AI response
        ai_text = response.text

        # Return response
        return jsonify({
            "response": ai_text
        })

    except Exception as e:

        return jsonify({
            "response": f"Error: {str(e)}"
        })

# Run Server
if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )
