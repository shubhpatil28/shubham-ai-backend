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

sio = socketio.Client(reconnection=True, reconnection_attempts=0, reconnection_delay=5, reconnection_delay_max=30, logger=True, engineio_logger=True)

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

# ── Alias Table: every accepted spelling → canonical command key ──
COMMAND_ALIASES = {
    # Chrome
    "open chrome":   "open chrome",
    "chrome":        "open chrome",
    # VSCode
    "open vscode":   "open vscode",
    "vscode":        "open vscode",
    "vs code":       "open vscode",
    "code":          "open vscode",
    # WhatsApp
    "open whatsapp": "open whatsapp",
    "whatsapp":      "open whatsapp",
    # Downloads
    "open downloads":"open downloads",
    "downloads":     "open downloads",
    # Documents
    "open documents":"open documents",
    "documents":     "open documents",
    # Shutdown
    "shutdown pc":   "shutdown pc",
    "shutdown":      "shutdown pc",
    "shut down":     "shutdown pc",
    # Restart
    "restart pc":    "restart pc",
    "restart":       "restart pc",
    "reboot":        "restart pc",
}

# ── Dispatch Table: canonical command key → handler function ──
def _handle_open_chrome():
    subprocess.Popen(["start", "chrome"], shell=True)

def _handle_open_vscode():
    subprocess.Popen(["code"], shell=True)

def _handle_open_whatsapp():
    subprocess.Popen(["start", "whatsapp://"], shell=True)

def _handle_open_downloads():
    subprocess.Popen(["explorer", str(Path.home() / "Downloads")])

def _handle_open_documents():
    subprocess.Popen(["explorer", str(Path.home() / "Documents")])

def _handle_shutdown_pc():
    print("⚠️ DANGEROUS_ACTION: SHUTDOWN INITIATED")
    subprocess.Popen(["shutdown", "/s", "/t", "60"])

def _handle_restart_pc():
    print("⚠️ DANGEROUS_ACTION: RESTART INITIATED")
    subprocess.Popen(["shutdown", "/r", "/t", "60"])

COMMAND_HANDLERS = {
    "open chrome":    _handle_open_chrome,
    "open vscode":    _handle_open_vscode,
    "open whatsapp":  _handle_open_whatsapp,
    "open downloads": _handle_open_downloads,
    "open documents": _handle_open_documents,
    "shutdown pc":    _handle_shutdown_pc,
    "restart pc":     _handle_restart_pc,
}

@sio.on('execute_command')
def on_execute_command(data):
    # ── 1. Normalise ──────────────────────────────────────────────
    raw_cmd = data.get('command', '').strip().lower()
    print(f"\n📥 INCOMING DIRECTIVE: {raw_cmd}")

    canonical = None
    folder_name = None

    # ── 2. Special-case: parameterised "create folder <name>" ─────
    #    Must be checked BEFORE the alias table (exact-match would miss it).
    if raw_cmd.startswith("create folder"):
        canonical = "create folder"
        folder_name = raw_cmd[len("create folder"):].strip() or "New AI Folder"

    elif raw_cmd.startswith("make folder"):
        canonical = "create folder"
        folder_name = raw_cmd[len("make folder"):].strip() or "New AI Folder"

    elif raw_cmd.startswith("new folder"):
        canonical = "create folder"
        folder_name = raw_cmd[len("new folder"):].strip() or "New AI Folder"

    else:
        # ── 3. Alias lookup (exact match) ─────────────────────────
        canonical = COMMAND_ALIASES.get(raw_cmd)

    # ── 4. Dispatch ──────────────────────────────────────────────
    try:
        if canonical == "create folder":
            path = Path.home() / "Desktop" / folder_name
            os.makedirs(path, exist_ok=True)
            print(f"COMMAND_EXECUTED: create folder '{folder_name}'")

        elif canonical in COMMAND_HANDLERS:
            COMMAND_HANDLERS[canonical]()
            print(f"COMMAND_EXECUTED: {canonical}")

        else:
            print(f"EXECUTION_FAILED: UNRECOGNIZED_COMMAND '{raw_cmd}'")

    except Exception as e:
        print(f"EXECUTION_FAILED: {str(e)}")


# Heartbeat loop
def start_heartbeat():
    while True:
        if sio.connected:
            sio.emit('heartbeat', {})
        time.sleep(20)

if __name__ == "__main__":
    test_mode = "--test" in sys.argv
    
    print_diagnostics()
    
    if test_mode:
        print("🧪 TEST MODE ACTIVE: AGENT WILL CONNECT AND WAIT FOR COMMANDS")

    # Reconnection loop with exponential backoff and stable timeouts
    reconnect_delay = 5
    max_delay = 60
    
    while True:
        try:
            if not sio.connected:
                print(f"🔄 ATTEMPTING_CONNECTION: {API_URL} (Delay: {reconnect_delay}s)")
                sio.connect(
                    API_URL,
                    transports=["polling"],
                    wait_timeout=60,
                    headers={"Origin": "https://shubham-ai-os-fronted.vercel.app"}
                )
                reconnect_delay = 5 # Reset on success
                sio.wait()
            else:
                sio.wait()
        except Exception as e:
            print(f"❌ Connection error: {e}")
            time.sleep(reconnect_delay)
            reconnect_delay = min(reconnect_delay * 2, max_delay)
