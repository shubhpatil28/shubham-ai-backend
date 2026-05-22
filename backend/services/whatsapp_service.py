import os
import time
import queue
import threading
from concurrent.futures import Future
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import database

class WhatsAppService:
    def __init__(self):
        # Dedicated persistent WhatsApp/Chrome session profile
        self.user_data_dir = os.path.join(os.path.expanduser("~"), "ShubhamAI_WhatsApp_Profile")
        os.makedirs(self.user_data_dir, exist_ok=True)
        
        self.driver = None
        self.task_queue = queue.Queue()
        self.worker_thread = None
        self.is_running = False
        
        # Start worker thread on initialization
        self.start_worker()

    def start_worker(self):
        """Starts the background Selenium worker thread."""
        if self.worker_thread and self.worker_thread.is_alive():
            return
        self.is_running = True
        self.worker_thread = threading.Thread(target=self._queue_worker, name="WhatsAppSeleniumWorker", daemon=True)
        self.worker_thread.start()
        print("[WhatsApp Service] Background worker thread started successfully.")

    def stop_worker(self):
        """Stops the worker thread and quits the driver."""
        self.is_running = False
        self.task_queue.put(None) # Sentinel to stop thread
        if self.worker_thread:
            self.worker_thread.join(timeout=5)
        self._quit_driver()

    def _init_driver(self):
        """Initializes Chrome driver if not already open."""
        if self.driver:
            try:
                # Test connection by fetching title
                _ = self.driver.title
                return
            except Exception:
                print("[WhatsApp Service] Existing browser closed or crashed. Re-initializing...")
                self._quit_driver()

        print("[WhatsApp Service] Initializing Selenium Chrome Driver...")
        try:
            options = Options()
            options.add_argument(f"user-data-dir={self.user_data_dir}")
            options.add_argument("--profile-directory=Default")
            options.add_argument("--disable-blink-features=AutomationControlled")
            
            # Keep browser active after python process ends (if needed, but our worker thread stays alive)
            options.add_experimental_option("detach", True)
            
            # Setup driver
            self.driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
            self.driver.maximize_window()
            print("[WhatsApp Service] Chrome Webdriver initialized successfully.")
        except Exception as e:
            print(f"[WhatsApp Service] Failed to initialize Chrome Driver: {e}")
            self.driver = None
            raise e

    def _quit_driver(self):
        """Safely shuts down Chrome Driver."""
        if self.driver:
            try:
                self.driver.quit()
            except Exception:
                pass
            self.driver = None
            print("[WhatsApp Service] Chrome Driver shut down.")

    def execute_task(self, task_type, **kwargs):
        """Helper to submit a task to the queue and wait for the result."""
        self.start_worker() # Make sure worker is running
        future = Future()
        task = {
            "type": task_type,
            "future": future,
            "args": kwargs
        }
        self.task_queue.put(task)
        # Block and wait for result (timeout 45s to allow user scan/load)
        try:
            return future.result(timeout=60)
        except Exception as e:
            print(f"[WhatsApp Service] Task {task_type} failed: {e}")
            raise e

    def _queue_worker(self):
        """Worker thread processing tasks sequentially."""
        while self.is_running:
            try:
                task = self.task_queue.get(timeout=2)
                if task is None:
                    break # Stop signal
                
                task_type = task["type"]
                future = task["future"]
                args = task["args"]
                
                print(f"[WhatsApp Worker] Dequeued task: {task_type}")
                
                # Execute action
                try:
                    self._init_driver()
                    result = None
                    
                    if task_type == "open_whatsapp":
                        result = self._open_whatsapp_action()
                    elif task_type == "open_contact":
                        result = self._open_contact_action(args.get("recipient"))
                    elif task_type == "send_message":
                        result = self._send_message_action(args.get("recipient"), args.get("message"))
                    elif task_type == "send_file":
                        result = self._send_file_action(args.get("recipient"), args.get("file_path"))
                    elif task_type == "upload_status":
                        result = self._upload_status_action(args.get("file_path"))
                    elif task_type == "read_messages":
                        result = self._read_messages_action(args.get("recipient"))
                    else:
                        raise ValueError(f"Unknown task type: {task_type}")
                    
                    future.set_result(result)
                except Exception as e:
                    future.set_exception(e)
                finally:
                    self.task_queue.task_done()
                    
            except queue.Empty:
                continue
            except Exception as e:
                print(f"[WhatsApp Worker] Error in worker loop: {e}")
                time.sleep(1)

    # --- SELENIUM ACTIONS ---

    def _open_whatsapp_action(self):
        """Navigates to WhatsApp Web and checks if loaded."""
        self.driver.get("https://web.whatsapp.com/")
        print("[WhatsApp Service] Navigated to WhatsApp Web. Checking login status...")
        
        # Wait for search box to determine if logged in (user may need to scan QR)
        wait = WebDriverWait(self.driver, 60)
        search_box_xpath = '//div[@contenteditable="true"][@data-tab="3"]'
        
        try:
            wait.until(EC.presence_of_element_located((By.XPATH, search_box_xpath)))
            return "WhatsApp Web successfully loaded and logged in!"
        except Exception:
            # Maybe search box layout changed, try alternate lexical selector
            try:
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.lexical-rich-text-input div[contenteditable='true']")))
                return "WhatsApp Web successfully loaded and logged in (alternative selector)!"
            except Exception:
                return "WhatsApp loaded, verification/QR scan is required!"

    def _search_and_select_contact(self, recipient):
        """Helper to search for a contact and open the chat."""
        # Resolve nickname from Contact Memory if available
        resolved_name = database.get_contact_by_nickname(recipient)
        search_name = resolved_name if resolved_name else recipient
        print(f"[WhatsApp Service] Searching for recipient: {search_name} (Input: {recipient})")

        # 1. Ensure we are on main screen or look for search box
        wait = WebDriverWait(self.driver, 15)
        
        # Selectors for search box
        search_box = None
        try:
            search_box = wait.until(EC.element_to_be_clickable((By.XPATH, '//div[@contenteditable="true"][@data-tab="3"]')))
        except Exception:
            search_box = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "div.lexical-rich-text-input div[contenteditable='true']")))
            
        search_box.click()
        # Clear search
        search_box.send_keys(Keys.CONTROL + "a")
        search_box.send_keys(Keys.BACKSPACE)
        # Type name
        search_box.send_keys(search_name)
        time.sleep(2.5) # Wait for list to filter
        
        # Press Enter on search box to select the first filtered contact
        search_box.send_keys(Keys.ENTER)
        time.sleep(2) # Wait for chat pane to load
        print(f"[WhatsApp Service] Selected contact: {search_name}")
        return search_name

    def _open_contact_action(self, recipient):
        """Opens a specific contact chat."""
        if not recipient:
            raise ValueError("Recipient parameter is required.")
        resolved = self._search_and_select_contact(recipient)
        return f"Chat for '{resolved}' is now open!"

    def _send_message_action(self, recipient, message):
        """Sends a text message to a contact."""
        if not recipient or not message:
            raise ValueError("Recipient and message parameters are required.")
            
        # Search and open chat
        resolved = self._search_and_select_contact(recipient)
        
        # Find message box
        wait = WebDriverWait(self.driver, 10)
        try:
            message_box = wait.until(EC.element_to_be_clickable((By.XPATH, '//div[@contenteditable="true"][@data-tab="10"]')))
        except Exception:
            message_box = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "footer div[contenteditable='true']")))
            
        message_box.click()
        # Input and send message
        message_box.send_keys(message)
        time.sleep(0.5)
        message_box.send_keys(Keys.ENTER)
        
        print(f"[WhatsApp Service] Sent message to {resolved}: '{message}'")
        return f"WhatsApp message successfully sent to {resolved}!"

    def _send_file_action(self, recipient, file_path):
        """Sends a file or image attachment to a contact."""
        if not recipient or not file_path:
            raise ValueError("Recipient and file_path parameters are required.")
            
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Attachment file not found at: {file_path}")
            
        # Ensure absolute path
        abs_file_path = os.path.abspath(file_path)
        
        # Search and open chat
        resolved = self._search_and_select_contact(recipient)
        
        # Find attach button (Paperclip or Plus icon)
        wait = WebDriverWait(self.driver, 10)
        try:
            # Selectors: aria-label="Attach" or data-icon="plus"
            attach_btn = wait.until(EC.element_to_be_clickable((By.XPATH, '//div[@title="Attach"] | //button[@aria-label="Attach"]')))
            attach_btn.click()
        except Exception:
            # Alternative: Plus icon
            attach_btn = wait.until(EC.element_to_be_clickable((By.XPATH, '//span[@data-icon="plus"]/ancestor::div[@role="button"]')))
            attach_btn.click()
            
        time.sleep(1)
        
        # Find the hidden input file element
        # Accept criteria: images/videos/docs
        try:
            file_input = wait.until(EC.presence_of_element_located((By.XPATH, '//input[@type="file"]')))
        except Exception:
            file_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']")))
            
        # Send absolute path to the input
        file_input.send_keys(abs_file_path)
        time.sleep(2) # Wait for preview window to open
        
        # Find Send button in preview
        try:
            send_btn = wait.until(EC.element_to_be_clickable((By.XPATH, '//span[@data-icon="send"]/ancestor::div[@role="button"] | //div[@aria-label="Send"]')))
            send_btn.click()
        except Exception:
            # Fallback press enter key on main window
            active_element = self.driver.switch_to.active_element
            active_element.send_keys(Keys.ENTER)
            
        time.sleep(3) # Wait for upload to complete
        print(f"[WhatsApp Service] Sent file {abs_file_path} to {resolved}")
        return f"File '{os.path.basename(abs_file_path)}' successfully sent to {resolved}!"

    def _upload_status_action(self, file_path):
        """Uploads an image/video to Status."""
        if not file_path:
            raise ValueError("file_path parameter is required to upload status.")
            
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Status file not found at: {file_path}")
            
        abs_file_path = os.path.abspath(file_path)
        wait = WebDriverWait(self.driver, 15)
        
        # 1. Click Status button
        try:
            status_btn = wait.until(EC.element_to_be_clickable((By.XPATH, '//span[@data-icon="status-v3"]/ancestor::div[@role="button"] | //button[@aria-label="Status"]')))
            status_btn.click()
        except Exception:
            # Try alternate title status
            status_btn = wait.until(EC.element_to_be_clickable((By.XPATH, '//div[@title="Status"]')))
            status_btn.click()
            
        time.sleep(2)
        
        # 2. Inside status page, click "Add status" or locate status file input
        # Note: WhatsApp Web often shows a hidden input file directly or click 'My Status'
        try:
            # Look for file input
            file_input = wait.until(EC.presence_of_element_located((By.XPATH, '//input[@type="file"]')))
            file_input.send_keys(abs_file_path)
        except Exception as e:
            # Try clicking My Status button first if input not visible
            try:
                my_status = wait.until(EC.element_to_be_clickable((By.XPATH, '//div[contains(text(), "My Status")] | //span[contains(text(), "My status")]')))
                my_status.click()
                time.sleep(1)
                file_input = wait.until(EC.presence_of_element_located((By.XPATH, '//input[@type="file"]')))
                file_input.send_keys(abs_file_path)
            except Exception:
                raise Exception(f"Failed to trigger status upload. Make sure status panel is visible: {e}")
                
        time.sleep(3) # Wait for status preview
        
        # 3. Click send status
        try:
            send_btn = wait.until(EC.element_to_be_clickable((By.XPATH, '//span[@data-icon="send"]/ancestor::div[@role="button"] | //div[@aria-label="Send"]')))
            send_btn.click()
        except Exception:
            active_element = self.driver.switch_to.active_element
            active_element.send_keys(Keys.ENTER)
            
        time.sleep(4) # Let it upload
        print(f"[WhatsApp Service] Uploaded status: {abs_file_path}")
        return "WhatsApp Status successfully updated!"

    def _read_messages_action(self, recipient=None):
        """Reads latest message bubbles from the active chat window."""
        # If recipient is provided, open their chat first.
        # If not, read from whatever chat is currently active.
        if recipient:
            self._search_and_select_contact(recipient)
            
        time.sleep(1.5)
        
        # Find all message container rows
        # Class names are usually 'message-in' or 'message-out'
        wait = WebDriverWait(self.driver, 10)
        
        try:
            # Locate all messages
            message_bubbles = wait.until(EC.presence_of_all_elements_located((
                By.XPATH, '//div[contains(@class, "message-in") or contains(@class, "message-out")]'
            )))
        except Exception:
            return [] # No messages found or failed to load
            
        # Get the latest 5 messages
        latest_bubbles = message_bubbles[-5:] if len(message_bubbles) > 5 else message_bubbles
        messages = []
        
        for bubble in latest_bubbles:
            try:
                # Check class to see if in or out
                bubble_class = bubble.get_attribute("class")
                sender = "contact" if "message-in" in bubble_class else "me"
                
                # Extract text inside bubble
                # Check different common spans
                text = ""
                try:
                    # WhatsApp uses copyable-text or selectable-text
                    span_el = bubble.find_element(By.CSS_SELECTOR, "span.selectable-text span, span.copyable-text span")
                    text = span_el.text.strip()
                except Exception:
                    # Get all text from bubble excluding timestamp
                    text = bubble.text.strip()
                    # Remove timestamp if it's appended at the end (e.g. "12:30 PM\nHello")
                    # We can try to clean it, but general text works for basic voice TTS
                    
                if text:
                    messages.append({
                        "sender": sender,
                        "text": text
                    })
            except Exception:
                continue
                
        print(f"[WhatsApp Service] Read {len(messages)} messages.")
        return messages

    def get_status(self):
        """Checks if Chrome and worker are alive."""
        if not self.is_running:
            return "offline"
        if not self.driver:
            return "idle"
        try:
            _ = self.driver.title
            return "online"
        except Exception:
            return "crashed"
