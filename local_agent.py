import socketio
import subprocess
import os
import time
import sys
import platform
import uuid
import webbrowser
import threading
from pathlib import Path

# ── SHUBHAM AI OS — Local Machine Agent ──
# This script runs on your Windows machine to execute commands
# received from the cloud backend.

# Configuration
API_URL = "https://shubham-ai-backend.onrender.com"
DEVICE_ID = str(uuid.getnode())

# reconnection=False: the manual while-True loop below is the ONLY reconnect
# path. Built-in auto-reconnect must be OFF so agent_login is always
# re-emitted after every connect(), keeping the backend registry current.
sio = socketio.Client(
    reconnection=False,
    logger=True,
    engineio_logger=True
)

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
    print("CONNECT_EVENT_TRIGGERED")
    print("SOCKET_SID", sio.sid)
    print(f"CONNECT_EVENT_TRIGGERED: sid={sio.sid}")
    print("\n✅ CONNECTED TO SHUBHAM AI CLOUD BACKEND")
    print("✅ LISTENING FOR DIRECTIVES")
    # Emit authentication / registration
    sio.emit('agent_login', {
        'device_type': 'windows_machine',
        'device_id': DEVICE_ID,
        'platform': platform.system()
    })
    print("AGENT_LOGIN_EMITTED")

@sio.event
def connect_error(data):
    print(f"\n❌ CONNECTION_FAILED: {data}")

@sio.event
def disconnect():
    print("DISCONNECT_EVENT_TRIGGERED")
    print("\n❌ DISCONNECTED FROM BACKEND")
    print("🔄 STANDBY: ATTEMPTING RECONNECTION...")

@sio.on('login_success')
def on_login_success(data):
    print("LOGIN_SUCCESS_RECEIVED")
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
# NOTE: 'start' is a CMD built-in and cannot be called via subprocess list.
# Use os.startfile() for registered Win32 apps, webbrowser for URLs.

def _handle_open_chrome():
    print("AGENT_CHROME_HANDLER_ENTERED")
    # Try the direct executable first, fall back to webbrowser
    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    launched = False
    for path in chrome_paths:
        if os.path.exists(path):
            print(f"AGENT_SUBPROCESS_LAUNCH: {path}")
            subprocess.Popen([path])
            launched = True
            break
    if not launched:
        print("AGENT_CHROME_PATH_NOT_FOUND: falling back to webbrowser")
        webbrowser.open("https://google.com")
    print("AGENT_SUBPROCESS_SUCCESS: open chrome")

def _handle_open_vscode():
    # 'code' is on PATH when VS Code is installed with shell integration
    vscode_paths = [
        str(Path.home() / "AppData" / "Local" / "Programs" / "Microsoft VS Code" / "Code.exe"),
        r"C:\Program Files\Microsoft VS Code\Code.exe",
    ]
    launched = False
    for path in vscode_paths:
        if os.path.exists(path):
            subprocess.Popen([path])
            launched = True
            break
    if not launched:
        # Fallback: try 'code' on PATH
        try:
            subprocess.Popen(["code"], shell=True)
            launched = True
        except Exception:
            pass
    if not launched:
        raise RuntimeError("VS Code not found")

def _handle_open_whatsapp():
    # WhatsApp Desktop registers the whatsapp:// URI handler via os.startfile
    try:
        os.startfile("whatsapp://")
    except Exception:
        # Fallback: open WhatsApp Web
        webbrowser.open("https://web.whatsapp.com")

def _handle_open_downloads():
    path = str(Path.home() / "Downloads")
    os.startfile(path)

def _handle_open_documents():
    path = str(Path.home() / "Documents")
    os.startfile(path)

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


# Heartbeat loop — runs in a daemon thread so it never blocks the main loop
def start_heartbeat():
    while True:
        time.sleep(20)
        try:
            if sio.connected:
                sio.emit('heartbeat', {})
                print("HEARTBEAT_SENT")
                print("AGENT_HEARTBEAT_SENT")
        except Exception as hb_err:
            print(f"HEARTBEAT_ERROR: {hb_err}")

if __name__ == "__main__":
    test_mode = "--test" in sys.argv

    print_diagnostics()

    if test_mode:
        print("🧪 TEST MODE ACTIVE: AGENT WILL CONNECT AND WAIT FOR COMMANDS")

    # ── Start heartbeat in background BEFORE the connect loop ──────
    hb_thread = threading.Thread(target=start_heartbeat, daemon=True)
    hb_thread.start()
    print("HEARTBEAT_THREAD_STARTED")

    # ── Manual reconnect loop with exponential backoff ─────────────
    # reconnection=False on the client ensures THIS loop is the only
    # reconnect path. Every iteration re-emits agent_login via the
    # connect() handler, keeping the backend registry clean.
    reconnect_delay = 5
    max_delay = 60

    while True:
        try:
            print(f"🔄 ATTEMPTING_CONNECTION: {API_URL}")
            # WebSocket is mandatory for stability on Render free tier.
            # Polling is too fragile (5s timeouts).
            sio.connect(
                API_URL,
                transports=["websocket", "polling"],
                wait_timeout=60, # Increased for slow Render startup
                headers={"Origin": "https://shubham-ai-os-fronted.vercel.app"}
            )
            reconnect_delay = 5  # reset on successful connect
            print(f"CONNECTION_ESTABLISHED: sid={sio.sid} entering wait loop")
            sio.wait()  # blocks until disconnect
        except Exception as e:
            print(f"❌ Connection error: {e}")
        finally:
            # Always clean up before retrying
            try:
                if sio.connected:
                    sio.disconnect()
            except Exception:
                pass

        print(f"🔄 RECONNECTING in {reconnect_delay}s...")
        time.sleep(reconnect_delay)
        reconnect_delay = min(reconnect_delay * 2, max_delay)
