import os
import subprocess
import threading
import urllib.parse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

class AutomationService:
    def __init__(self, whatsapp_service=None):
        self.whatsapp = whatsapp_service
        print("[AutomationService] Initialized and connected to WhatsAppService.")

    def open_app(self, app_name):
        """Launches a desktop application using Windows subprocess."""
        name = app_name.lower().strip()
        print(f"[Automation] Attempting to open application: {name}")
        try:
            if "calc" in name:
                subprocess.Popen("calc.exe")
                return "Calculator उघडली आहे! 🔢"
            elif "note" in name:
                subprocess.Popen("notepad.exe")
                return "Notepad उघडले आहे! 📝"
            elif "chrome" in name or "browser" in name:
                subprocess.Popen("start chrome", shell=True)
                return "Chrome browser उघडला आहे! 🌐"
            elif "explorer" in name or "my computer" in name or "folder" in name:
                subprocess.Popen("explorer.exe")
                return "File Explorer उघडला आहे! 📁"
            else:
                subprocess.Popen(name, shell=True)
                return f"{name} launch करायचा प्रयत्न करतोय... 🚀"
        except Exception as e:
            err_msg = f"Failed to open app {app_name}: {e}"
            print(err_msg)
            return f"दिलगीर आहे, process launch करताना error आली: {e} ❌"

    def browser_search(self, query):
        """Launches Chrome with a Google search query."""
        def run_selenium():
            try:
                options = Options()
                options.add_experimental_option("detach", True)
                driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
                search_url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
                driver.get(search_url)
                print(f"[Automation] Browser search opened for: {query}")
            except Exception as e:
                print(f"[Automation] Selenium browser search failed: {e}")

        thread = threading.Thread(target=run_selenium, daemon=True)
        thread.start()
        return f"Google वर '{query}' search करत आहे, browser पहा, मित्रा! 🔍"

    # --- WhatsApp Delegation Methods (Delegates to self.whatsapp if active) ---

    def open_whatsapp(self):
        """Opens WhatsApp Web using the shared Selenium service."""
        if not self.whatsapp:
            return "WhatsApp Service initialized नाहीये, मित्रा! ❌"
            
        def run():
            try:
                self.whatsapp.execute_task("open_whatsapp")
            except Exception as e:
                print(f"Error opening WhatsApp: {e}")
                
        threading.Thread(target=run, daemon=True).start()
        return "WhatsApp Web launch करतोय, check कर! 🌐"

    def open_contact_chat(self, contact_name):
        """Opens a specific contact's chat in WhatsApp Web."""
        if not self.whatsapp:
            return "WhatsApp Service active नाहीये! ❌"
            
        def run():
            try:
                self.whatsapp.execute_task("open_contact", recipient=contact_name)
            except Exception as e:
                print(f"Error opening contact chat: {e}")
                
        threading.Thread(target=run, daemon=True).start()
        return f"{contact_name} चा chat open करतोय! 💬"

    def send_whatsapp_message(self, recipient, message):
        """Sends a text message to a WhatsApp contact."""
        if not self.whatsapp:
            return "WhatsApp Service load नाही झाला! ❌"
            
        def run():
            try:
                self.whatsapp.execute_task("send_message", recipient=recipient, message=message)
            except Exception as e:
                print(f"Error sending message: {e}")
                
        threading.Thread(target=run, daemon=True).start()
        return f"{recipient} ला message pathavtoy background मध्ये! 🚀"

    def send_whatsapp_file(self, recipient, file_path):
        """Sends a file attachment to a WhatsApp contact."""
        if not self.whatsapp:
            return "WhatsApp Service dynamic queue start नाही झाली! ❌"
            
        if not file_path or not os.path.exists(file_path):
            return f"File सापडली नाही: '{file_path}' 📂"
            
        def run():
            try:
                self.whatsapp.execute_task("send_file", recipient=recipient, file_path=file_path)
            except Exception as e:
                print(f"Error sending file: {e}")
                
        threading.Thread(target=run, daemon=True).start()
        return f"{recipient} ला file attachment send करतोय! 📎"

    def upload_status(self, file_path=None):
        """Uploads an image or video to status."""
        if not self.whatsapp:
            return "WhatsApp Service system verification key setup missing! ❌"
            
        if not file_path:
            return "Status upload करण्यासाठी file path mandatory आहे! 📸"
            
        if not os.path.exists(file_path):
            return f"File सापडली नाही: '{file_path}' 📸"
            
        def run():
            try:
                self.whatsapp.execute_task("upload_status", file_path=file_path)
            except Exception as e:
                print(f"Error uploading status: {e}")
                
        threading.Thread(target=run, daemon=True).start()
        return "Status upload task queue मध्ये टाकला आहे, launch होईल! 📸"

    def read_latest_messages(self, contact=None):
        """Reads latest message bubbles from active or target chat (Synchronous for API)."""
        if not self.whatsapp:
            return "WhatsApp Service offline ahe! ❌"
            
        try:
            messages = self.whatsapp.execute_task("read_messages", recipient=contact)
            return messages
        except Exception as e:
            print(f"Error reading latest messages: {e}")
            return f"Messages vachayla failure: {e}"
