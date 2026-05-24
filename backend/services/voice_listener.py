import speech_recognition as sr
import threading
import io
import time
from openai import OpenAI
from config import OPENAI_API_KEY
import tempfile
import os

class VoiceListener:
    """
    Continuous background voice listener that streams captured audio
    to OpenAI Whisper API for highly accurate Marathi/English transcription.
    Replaces the browser's unstable SpeechRecognition API.
    """
    def __init__(self, socketio=None, ai_service=None):
        self.recognizer = sr.Recognizer()
        # Optimize for Marathi+English background noise
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.energy_threshold = 400
        self.recognizer.pause_threshold = 1.0
        
        self.mic = None
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        self.socketio = socketio
        self.ai_service = ai_service
        self.is_listening = False
        self.stop_listening_fn = None
        self.wakeword = "hey buddy"
        
        try:
            self.mic = sr.Microphone()
            with self.mic as source:
                print("[VoiceListener] Calibrating for ambient noise...")
                self.recognizer.adjust_for_ambient_noise(source, duration=2)
                print("[VoiceListener] Calibration complete.")
        except (OSError, AttributeError) as e:
            print(f"[VoiceListener] WARNING: No microphone detected ({e}). Voice input disabled.")
            self.mic = None

    def emit_state(self, state, text=None):
        """Sends real-time state to the frontend UI Orb via Socket.IO"""
        if self.socketio:
            payload = {"state": state}
            if text:
                payload["text"] = text
            self.socketio.emit('voice_state', payload)

    def process_audio(self, recognizer, audio_data):
        """Callback when VAD detects a complete phrase."""
        try:
            self.emit_state('processing')
            
            # Save raw audio to a temporary file for Whisper
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
                temp_wav.write(audio_data.get_wav_data())
                temp_wav_path = temp_wav.name
            
            text = ""
            if self.openai_client:
                # Transcribe using Whisper API (handles mixed languages flawlessly)
                with open(temp_wav_path, "rb") as audio_file:
                    transcript = self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        prompt="Marathi and English mixed context. For example: Kasa ahes tu? Open chrome kar."
                    )
                text = transcript.text
            else:
                # Fallback to local Faster-Whisper model
                try:
                    from faster_whisper import WhisperModel
                    if not hasattr(self, 'local_whisper'):
                        print("[VoiceListener] Loading local Faster-Whisper model (base)...")
                        self.local_whisper = WhisperModel("base", device="cpu", compute_type="int8")
                    
                    segments, _ = self.local_whisper.transcribe(temp_wav_path, beam_size=5)
                    text = " ".join([segment.text for segment in segments])
                except ImportError:
                    print("[VoiceListener] WARNING: faster-whisper not installed and OpenAI key missing. Using Google fallback.")
                    text = recognizer.recognize_google(audio_data, language="mr-IN")

            os.remove(temp_wav_path)
            
            text_lower = text.lower().strip()
            print(f"[VoiceListener] Heard: {text}")
            
            if not text_lower:
                self.emit_state('listening')
                return

            self.emit_state('transcript', text)
            
            # Auto-trigger AI processing if a valid command was heard
            if self.ai_service:
                response_text, action = self.ai_service.process_message(text)
                from app import execute_action, voice_service # Delayed import
                
                # We emit 'speaking' state while action is executed/spoken
                self.emit_state('speaking')
                action_result = execute_action(action)
                
                # Speak response out loud
                voice_service.speak(response_text)
                
                self.emit_state('listening')

        except sr.UnknownValueError:
            # Silence or unintelligible noise, ignore quietly to prevent "no-speech" loops
            self.emit_state('listening')
        except Exception as e:
            print(f"[VoiceListener] Error processing audio: {e}")
            self.emit_state('listening')

    def start(self):
        """Start listening in a continuous background thread.
        Always creates a fresh microphone instance to avoid conflicts.
        """
        if self.is_listening:
            return
        # Always create a new Microphone instance
        try:
            self.mic = sr.Microphone()
        except Exception as e:
            print(f"[VoiceListener] Cannot start: no microphone available ({e}).")
            self.mic = None
            return

        print("[VoiceListener] Starting background listening mode...")
        self.is_listening = True
        self.emit_state('listening')

        # listen_in_background spawns a thread and handles continuous VAD automatically
        self.stop_listening_fn = self.recognizer.listen_in_background(
            self.mic,
            self.process_audio,
            phrase_time_limit=10  # Max seconds per chunk to prevent infinitely long listens
        )

    def stop(self):
        """Stop listening and release resources safely."""
        if self.is_listening and self.stop_listening_fn:
            print("[VoiceListener] Stopping background listening mode.")
            # Wait for the background thread to finish and release the microphone
            try:
                self.stop_listening_fn(wait_for_stop=True)
            except Exception as e:
                print(f"[VoiceListener] Error while stopping listener: {e}")
            self.stop_listening_fn = None
        self.is_listening = False
        # Release the microphone resource
        if self.mic:
            self.mic = None
        self.emit_state('idle')
