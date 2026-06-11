import eventlet
eventlet.monkey_patch(all=True)
# pyrefly: ignore [missing-import]

import os
from app import app, socketio

# Production entry point
# Usage: gunicorn -k eventlet -w 1 run:app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Starting Shubham AI OS with SocketIO on port {port}...")
    socketio.run(app, host="0.0.0.0", port=port)
