import subprocess
import os
import sys

def execute_system_command(action, action_type):
    """Executes local OS commands for automation."""
    result = {"status": "success", "message": ""}
    
    if action_type == "open_app":
        app_name = action.get("app_name", "").lower()
        print(f"[Executor] Opening App: {app_name}")
        
        try:
            if "chrome" in app_name or "browser" in app_name:
                subprocess.Popen(["start", "chrome"], shell=True)
                result["message"] = "Chrome browser opened."
            elif "notepad" in app_name:
                subprocess.Popen(["notepad.exe"], shell=True)
                result["message"] = "Notepad opened."
            elif "vscode" in app_name or "code" in app_name:
                subprocess.Popen(["code"], shell=True)
                result["message"] = "VS Code opened."
            elif "calculator" in app_name or "calc" in app_name:
                subprocess.Popen(["calc.exe"], shell=True)
                result["message"] = "Calculator opened."
            elif "explorer" in app_name or "folder" in app_name:
                subprocess.Popen(["explorer.exe"], shell=True)
                result["message"] = "File Explorer opened."
            else:
                result["status"] = "error"
                result["message"] = f"App '{app_name}' not mapped in executor."
        except Exception as e:
            result["status"] = "error"
            result["message"] = str(e)
            
    elif action_type == "browser_search":
        query = action.get("query", "")
        print(f"[Executor] Searching Web: {query}")
        try:
            subprocess.Popen(["start", f"chrome", f"https://www.google.com/search?q={query}"], shell=True)
            result["message"] = f"Searching Google for '{query}'"
        except Exception as e:
            result["status"] = "error"
            result["message"] = str(e)
            
    else:
        result["status"] = "error"
        result["message"] = f"Unknown system command type: {action_type}"
        
    return result
