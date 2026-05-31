import socketio
import subprocess
import os
import time
import sys
import platform
import uuid
from pathlib import Path

# ── SHUBHAM AI OS — Local Machine Agent ──
# This script runs on your Windows machine to execute commands
# received from the cloud backend.

# Configuration
API_URL = "https://shubham-ai-backend.onrender.com"
DEVICE_ID = str(uuid.getnode())

sio = socketio.Client()

def print_diagnostics():
    print("=================================")
    print("     SHUBHAM AI LOCAL AGENT      ")
    print("=================================")
    print(f"Python Version:  {sys.version.split()[0]}")
    print(f"OS:              {platform.system()} {platform.release()}")
    print(f"Backend URL:     {API_URL}")
    print(f"Device ID:       {DEVICE_ID}")
    print(f"SocketIO Status: {'Connected' if sio.connected else 'Disconnected'}")
    print("=================================")

@sio.event
def connect():
    print("\n✅ CONNECTED TO SHUBHAM AI CLOUD BACKEND")
    print("✅ LISTENING FOR DIRECTIVES")
    # Emit authentication / registration
    sio.emit('agent_login', {
        'device_type': 'windows_machine',
        'device_id': DEVICE_ID,
        'platform': platform.system()
    })

@sio.event
def connect_error(data):
    print(f"\n❌ CONNECTION_FAILED: {data}")

@sio.event
def disconnect():
    print("\n❌ DISCONNECTED FROM BACKEND")
    print("🔄 STANDBY: ATTEMPTING RECONNECTION...")

@sio.on('login_success')
def on_login_success(data):
    print(f"🔐 AUTHENTICATION_SUCCESS: {data.get('status')}")

@sio.on('execute_command')
def on_execute_command(data):
    command = data.get('command', '').lower()
    print(f"\n📥 INCOMING DIRECTIVE: {command}")
    
    try:
        success = False
        # ── Application Launchers ──
        if "open chrome" in command:
            subprocess.Popen(["start", "chrome"], shell=True)
            success = True
            
        elif "open vscode" in command:
            subprocess.Popen(["code"], shell=True)
            success = True

        elif "open whatsapp" in command:
            subprocess.Popen(["start", "whatsapp://"], shell=True)
            success = True

        # ── System Directories ──
        elif "open downloads" in command:
            path = str(Path.home() / "Downloads")
            subprocess.Popen(["explorer", path])
            success = True
            
        elif "open documents" in command:
            path = str(Path.home() / "Documents")
            subprocess.Popen(["explorer", path])
            success = True

        # ── Utilities ──
        elif "create folder" in command:
            folder_name = command.replace("create folder", "").strip()
            if not folder_name:
                folder_name = "New AI Folder"
            path = Path.home() / "Desktop" / folder_name
            os.makedirs(path, exist_ok=True)
            success = True

        # ── Dangerous Actions ──
        elif "shutdown pc" in command:
            print("⚠️ DANGEROUS_ACTION: SHUTDOWN INITIATED")
            subprocess.Popen(["shutdown", "/s", "/t", "60"])
            success = True
            
        elif "restart pc" in command:
            print("⚠️ DANGEROUS_ACTION: RESTART INITIATED")
            subprocess.Popen(["shutdown", "/r", "/t", "60"])
            success = True

        if success:
            print("EXECUTION_SUCCESS")
        else:
            print("⚠️ EXECUTION_FAILED: UNRECOGNIZED_COMMAND")

    except Exception as e:
        print("EXECUTION_FAILED")
        print(f"ERROR: {str(e)}")

# Heartbeat loop
def start_heartbeat():
    while True:
        if sio.connected:
            sio.emit('heartbeat', {})
        time.sleep(30)

if __name__ == "__main__":
    test_mode = "--test" in sys.argv
    
    print_diagnostics()
    
    if test_mode:
        print("🧪 TEST MODE ACTIVE: AGENT WILL CONNECT AND WAIT FOR COMMANDS")

    # Reconnection loop
    while True:
        try:
            if not sio.connected:
                sio.connect(
                    API_URL,
                    transports=["polling"],
                    wait_timeout=30,
                    headers={"Origin": "https://shubham-ai-os-fronted.vercel.app"}
                )
            sio.wait()
        except Exception as e:
            print(f"❌ Connection error: {e}")
            time.sleep(10)
