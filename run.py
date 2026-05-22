import os
import sys
import subprocess
import time
import signal

def check_dependencies():
    print("[Shubham AI Launcher] Checking Python dependencies...")
    try:
        import flask
        import flask_cors
        import selenium
        import webdriver_manager
        import speech_recognition
        import openai
        import gtts
        import pygame
        import pyttsx3
        print("[Launcher] Python dependencies are present.")
    except ImportError as e:
        print(f"\n[Launcher WARNING] Missing dependency: {e.name}")
        print("Please run: pip install -r backend/requirements.txt\n")

def run_services():
    processes = []
    
    # 1. Start backend server
    print("[Launcher] Starting Flask API Backend...")
    backend_env = dict(os.environ, PYTHONIOENCODING="utf-8")
    backend_cmd = [sys.executable, "backend/app.py"]
    backend_proc = subprocess.Popen(
        backend_cmd, 
        cwd=os.path.abspath(os.path.dirname(__file__)),
        env=backend_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(backend_proc)

    # 2. Start frontend server
    print("[Launcher] Starting Vite React Frontend...")
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "frontend"))
    # Check if node_modules exists
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("[Launcher] node_modules not found. Installing node packages first...")
        subprocess.run("npm install", shell=True, cwd=frontend_dir)
        
    frontend_cmd = "npm run dev"
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        shell=True,
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    processes.append(frontend_proc)

    # Function to print output from processes
    def stream_output(proc, prefix):
        for line in iter(proc.stdout.readline, ''):
            print(f"{prefix}: {line.strip()}")
            if not proc.poll() is None:
                break

    import threading
    t1 = threading.Thread(target=stream_output, args=(backend_proc, "[BACKEND]"), daemon=True)
    t2 = threading.Thread(target=stream_output, args=(frontend_proc, "[FRONTEND]"), daemon=True)
    t1.start()
    t2.start()

    print("\n========================================================")
    print("Shubham AI is starting up! Access channels:")
    print("Frontend UI Console:  http://localhost:5173")
    print("Backend API Service:  http://localhost:5000")
    print("Press Ctrl+C to terminate all services.")
    print("========================================================\n")

    try:
        while True:
            time.sleep(1)
            # Check if any process terminated unexpectedly
            if backend_proc.poll() is not None:
                print(f"[Launcher] Backend terminated with exit code {backend_proc.poll()}")
                break
            if frontend_proc.poll() is not None:
                print(f"[Launcher] Frontend terminated with exit code {frontend_proc.poll()}")
                break
    except KeyboardInterrupt:
        print("\n[Launcher] Shutting down services...")
    finally:
        # Graceful shutdown of child processes
        for proc in processes:
            try:
                if sys.platform == "win32":
                    subprocess.run(f"taskkill /F /T /PID {proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    proc.terminate()
            except Exception:
                pass
        print("[Launcher] Services stopped. Goodbye!")

if __name__ == "__main__":
    check_dependencies()
    run_services()
