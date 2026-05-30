import socketio
import subprocess
import os
import time
from pathlib import Path

# ── SHUBHAM AI OS — Local Machine Agent ──
# This script runs on your Windows machine to execute commands
# received from the cloud backend.

# Configuration
API_URL = "https://shubham-ai-backend.onrender.com"

sio = socketio.Client()

@sio.event
def connect():
    print("\n✅ CONNECTED TO SHUBHAM AI CLOUD BACKEND")
    print("📡 STATUS: LISTENING FOR DIRECTIVES")
    sio.emit('agent_login', {'device_type': 'windows_machine'})

@sio.event
def disconnect():
    print("\n❌ DISCONNECTED FROM BACKEND")
    print("🔄 STANDBY: ATTEMPTING RECONNECTION...")

@sio.on('execute_command')
def on_execute_command(data):
    command = data.get('command', '').lower()
    print(f"\n📥 INCOMING DIRECTIVE: {command.upper()}")
    
    try:
        # ── Application Launchers ──
        if "open chrome" in command:
            subprocess.Popen(["start", "chrome"], shell=True)
            print("🚀 EXECUTION_SUCCESS: GOOGLE_CHROME_LAUNCHED")
            
        elif "open vscode" in command:
            subprocess.Popen(["code"], shell=True)
            print("🚀 EXECUTION_SUCCESS: VS_CODE_LAUNCHED")

        elif "open whatsapp" in command:
            subprocess.Popen(["start", "whatsapp://"], shell=True)
            print("🚀 EXECUTION_SUCCESS: WHATSAPP_LAUNCHED")

        # ── System Directories ──
        elif "open downloads" in command:
            path = str(Path.home() / "Downloads")
            subprocess.Popen(["explorer", path])
            print("🚀 EXECUTION_SUCCESS: EXPLORING_DOWNLOADS")
            
        elif "open documents" in command:
            path = str(Path.home() / "Documents")
            subprocess.Popen(["explorer", path])
            print("🚀 EXECUTION_SUCCESS: EXPLORING_DOCUMENTS")

        # ── Utilities ──
        elif "create folder" in command:
            folder_name = command.replace("create folder", "").strip()
            if not folder_name:
                folder_name = "New AI Folder"
            path = Path.home() / "Desktop" / folder_name
            os.makedirs(path, exist_ok=True)
            print(f"🚀 EXECUTION_SUCCESS: FOLDER_CREATED: {folder_name}")

        # ── Dangerous Actions ──
        elif "shutdown pc" in command:
            print("⚠️ DANGEROUS_ACTION_TRIGGERED: SHUTDOWN")
            subprocess.Popen(["shutdown", "/s", "/t", "60"])
            
        elif "restart pc" in command:
            print("⚠️ DANGEROUS_ACTION_TRIGGERED: RESTART")
            subprocess.Popen(["shutdown", "/r", "/t", "60"])

        else:
            print(f"⚠️ COMMAND_REJECTED: UNRECOGNIZED_INSTRUCTION")

    except Exception as e:
        print(f"❌ EXECUTION_CRITICAL_ERROR: {str(e)}")

# Heartbeat loop
def start_heartbeat():
    while True:
        if sio.connected:
            sio.emit('heartbeat', {})
        time.sleep(30)

if __name__ == "__main__":
    print("──────────────────────────────────────────")
    print("   SHUBHAM AI OS — LOCAL AGENT v1.0")
    print("──────────────────────────────────────────")
    
    while True:
        try:
            if not sio.connected:
                sio.connect(API_URL)
            sio.wait()
        except Exception as e:
            time.sleep(10)
