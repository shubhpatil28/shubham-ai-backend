import os
from app import app

# This file serves as the production entry point for Gunicorn
# Usage: gunicorn run:app

if __name__ == "__main__":
    # Local development runner
    port = int(os.environ.get("PORT", 5000))
    print(f"📡 Starting Local Server on port {port}...")
    app.run(host="0.0.0.0", port=port)
