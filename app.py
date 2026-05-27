from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)

CORS(app)

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

        headers = {
            "Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY')}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "deepseek/deepseek-chat-v3-0324:free",
            "messages": [
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )

        result = response.json()

        print(result)

        if "choices" in result:

            ai_text = result["choices"][0]["message"]["content"]

        else:

            ai_text = str(result)

        return jsonify({
            "response": ai_text
        })

    except Exception as e:

        return jsonify({
            "response": f"Error: {str(e)}"
        })

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )
