import time
import datetime
import threading
import database

class SchedulerService:
    def __init__(self, whatsapp_service):
        self.whatsapp_service = whatsapp_service
        self.is_running = False
        self.worker_thread = None

    def start(self):
        """Starts the background polling loop."""
        if self.worker_thread and self.worker_thread.is_alive():
            return
        self.is_running = True
        self.worker_thread = threading.Thread(target=self._poll_loop, name="WhatsAppScheduler", daemon=True)
        self.worker_thread.start()
        print("[Scheduler Service] Background scheduler thread started successfully.")

    def stop(self):
        """Stops the background polling loop."""
        self.is_running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=3)
        print("[Scheduler Service] Scheduler thread stopped.")

    def _poll_loop(self):
        """Infinite loop polling database for due messages every 10 seconds."""
        while self.is_running:
            try:
                # Format current time to YYYY-MM-DD HH:MM:SS
                now = datetime.datetime.now()
                current_time_str = now.strftime("%Y-%m-%d %H:%M:%S")
                
                # Fetch pending scheduled messages whose time is <= now
                pending_schedules = database.get_pending_schedules(current_time_str)
                
                if pending_schedules:
                    print(f"[Scheduler] Found {len(pending_schedules)} due scheduled message(s). Processing...")
                    
                    for sched in pending_schedules:
                        sched_id = sched["id"]
                        recipient = sched["recipient"]
                        message = sched["message"]
                        file_path = sched["file_path"]
                        
                        print(f"[Scheduler] Executing schedule #{sched_id} for {recipient}...")
                        
                        try:
                            # Execute the message send via WhatsAppService queue
                            if file_path:
                                self.whatsapp_service.execute_task(
                                    "send_file", 
                                    recipient=recipient, 
                                    file_path=file_path
                                )
                                print(f"[Scheduler] File schedule #{sched_id} successfully sent.")
                            else:
                                self.whatsapp_service.execute_task(
                                    "send_message", 
                                    recipient=recipient, 
                                    message=message
                                )
                                print(f"[Scheduler] Message schedule #{sched_id} successfully sent.")
                            
                            # Mark as sent
                            database.update_schedule_status(sched_id, "sent")
                        except Exception as e:
                            print(f"[Scheduler] Error executing schedule #{sched_id}: {e}")
                            database.update_schedule_status(sched_id, "failed")
                            
            except Exception as e:
                print(f"[Scheduler] Error in polling loop: {e}")
                
            time.sleep(10) # Poll every 10 seconds
