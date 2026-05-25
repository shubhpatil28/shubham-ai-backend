import requests
@app.route("/chat", methods=["POST"])
def chat():

    try:

        data = request.get_json()

        user_message = data["message"]

        URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={os.environ.get('GEMINI_API_KEY')}"

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
