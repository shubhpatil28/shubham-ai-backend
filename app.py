from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)

CORS(app)

API_KEY = os.environ.get("GEMINI_API_KEY")

URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={API_KEY}"

@app.route("/")
def home():
    return jsonify({
        "status": "Backend Running 🚀"
    })

@app.route("/chat", methods=["POST"])
def chat():

    try:

        data = request.get_json()

        user_message = data.get("message", "")

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": user_message
                        }
                    ]
                }
            ]
        }

        response = requests.post(
            URL,
            json=payload
        )

       response = requests.post(
    URL,
    json=payload
)

result = response.json()

print(result)

if "candidates" in result:

    ai_text = result["candidates"][0]["content"]["parts"][0]["text"]

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
