import os
import time
import threading
import tempfile
import re
import speech_recognition as sr
from openai import OpenAI
import pyttsx3
from gtts import gTTS
import pygame

from config import OPENAI_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
import database

class VoiceService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 300  # Default energy threshold
        self.recognizer.dynamic_energy_threshold = True
        
        # Initialize pyttsx3 locally
        try:
            self.tts_engine = pyttsx3.init()
            # Set speech rate
            self.tts_engine.setProperty('rate', 185)
        except Exception as e:
            print(f"pyttsx3 initialization failed: {e}. Will fallback to gTTS/ElevenLabs.")
            self.tts_engine = None
            
        # Initialize OpenAI Client
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        
        # Audio Player Init
        pygame.mixer.init()
        
        # Voice loop states
        self.is_listening = False
        self.wake_word = "hey buddy"
        self.active_session = False
        self.last_active_time = 0
        self.session_timeout = 15  # seconds to keep conversation active without wake word

    def is_marathi(self, text):
        # Check if text contains Devanagari character range (0x0900 to 0x097F)
        return any('\u0900' <= char <= '\u097f' for char in text)

    def speak(self, text):
        """Speaks text using ElevenLabs, gTTS, or pyttsx3, ensuring Marathi is pronounced correctly."""
        print(f"[Shubham AI Speaking]: {text}")
        if not text.strip():
            return
            
        # 1. Try ElevenLabs if API key is present
        if ELEVENLABS_API_KEY:
            try:
                import requests
                url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
                headers = {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": ELEVENLABS_API_KEY
                }
                data = {
                    "text": text,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": {
                        "stability": 0.75,
                        "similarity_boost": 0.75
                    }
                }
                response = requests.post(url, json=data, headers=headers)
                if response.status_code == 200:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
                        fp.write(response.content)
                        temp_file = fp.name
                    self._play_audio(temp_file)
                    return
                else:
                    print(f"ElevenLabs error: {response.text}. Falling back.")
            except Exception as e:
                print(f"ElevenLabs speech failed: {e}. Falling back.")
        
        # 2. Marathi text requires gTTS since pyttsx3 doesn't handle Devanagari well natively on standard Windows
        if self.is_marathi(text):
            try:
                tts = gTTS(text=text, lang='mr')
                with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
                    temp_file = fp.name
                tts.save(temp_file)
                self._play_audio(temp_file)
                return
            except Exception as e:
                print(f"gTTS for Marathi failed: {e}. Trying local pyttsx3.")

        # 3. Fallback to local pyttsx3 or gTTS (English)
        if self.tts_engine:
            try:
                # pyttsx3 runAndWait needs to run on main thread or be thread safe
                # We will run it in a thread-safe way or fall back to gTTS
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
                return
            except Exception as e:
                print(f"pyttsx3 failed: {e}. Trying gTTS English.")
                
        # 4. Final fallback: gTTS (English)
        try:
            tts = gTTS(text=text, lang='en')
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
                temp_file = fp.name
            tts.save(temp_file)
            self._play_audio(temp_file)
        except Exception as e:
            print(f"All TTS systems failed. Text: {text}")

    def _play_audio(self, file_path):
        """Helper to play audio via pygame mixer and clean up file."""
        try:
            pygame.mixer.music.load(file_path)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                time.sleep(0.1)
            pygame.mixer.music.unload()
            # Clean up the temp file
            os.remove(file_path)
        except Exception as e:
            print(f"Audio playback error: {e}")

    def listen_mic(self):
        """Listens from microphone, does noise reduction, and returns AudioData."""
        with sr.Microphone() as source:
            print("\n[Adjusting for ambient noise... Please wait]")
            self.recognizer.adjust_for_ambient_noise(source, duration=1.0)
            print("[Listening...]")
            try:
                audio = self.recognizer.listen(source, timeout=10, phrase_time_limit=10)
                return audio
            except sr.WaitTimeoutError:
                return None
            except Exception as e:
                print(f"Error in microphone listening: {e}")
                return None

    def transcribe_audio(self, audio):
        """Transcribes audio using OpenAI Whisper API or Google Speech Recognition as fallback."""
        if not audio:
            return ""
            
        # 1. Try Whisper API
        if self.openai_client:
            try:
                # Write audio to a temporary WAV file
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
                    temp_wav.write(audio.get_wav_data())
                    temp_wav_path = temp_wav.name
                
                with open(temp_wav_path, "rb") as audio_file:
                    transcript = self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        prompt="This text contains mixed Marathi and English speech."
                    )
                os.remove(temp_wav_path)
                return transcript.text.strip()
            except Exception as e:
                print(f"Whisper API transcription failed: {e}. Trying Google Web Speech API.")
        
        # 2. Fallback to Google speech recognition (Dual support: try English, then Marathi if short/empty, or dual)
        try:
            # We will perform Google Speech Recognition. Since it requires a language, 
            # we'll try Marathi first (since Marathi speech might fail English recognizer) 
            # or try English. Let's try recognizing as English-India (handles Indian accents well)
            # or Marathi.
            text = self.recognizer.recognize_google(audio, language="mr-IN")
            # If recognized text is Marathi, return it
            if self.is_marathi(text):
                return text
        except Exception:
            pass
            
        try:
            text = self.recognizer.recognize_google(audio, language="en-IN")
            return text
        except sr.UnknownValueError:
            print("[Google Speech Recognition could not understand audio]")
        except sr.RequestError as e:
            print(f"[Could not request results from Google Speech Recognition service; {e}]")
            
        return ""

    def listen_loop(self, chat_callback):
        """Synchronous background loop listening for 'Hey Buddy' wake word and user commands.
        Runs entirely on a plain thread — no asyncio, safe under Gunicorn/Eventlet.
        """
        self.is_listening = True
        print("[Voice Assistant listening in background... Say 'Hey Buddy' to activate]")
        
        while self.is_listening:
            try:
                audio = self.listen_mic()
                
                if not audio:
                    # Check for timeout if active session is on
                    if self.active_session and (time.time() - self.last_active_time > self.session_timeout):
                        print("[Active session timed out. Returning to wake word mode]")
                        self.active_session = False
                    continue
                    
                text = self.transcribe_audio(audio)
                if not text:
                    continue
                    
                print(f"[Transcribed]: {text}")
                
                # Check for wake word or session activity
                clean_text = text.lower()
                
                # Match "hey buddy" or "buddy"
                wake_word_detected = self.wake_word in clean_text or "hey buddy" in clean_text or "hello buddy" in clean_text
                
                if wake_word_detected or self.active_session:
                    self.last_active_time = time.time()
                    
                    # If wake word is detected, extract the command after the wake word if any
                    command = text
                    if wake_word_detected:
                        self.active_session = True
                        # Remove the wake word from command
                        command = re.sub(r'(hey\s+buddy|hello\s+buddy|buddy)', '', text, flags=re.IGNORECASE).strip()
                        
                        if not command:
                            # User just said the wake word
                            self.speak("हो, बोल मित्रा! I am listening. What can I do for you today?")
                            continue
                    
                    print(f"[Processing Command]: {command}")
                    # Execute chat callback (must be a regular function, not a coroutine)
                    response = chat_callback(command)
                    
                    # Speak response
                    if response:
                        self.speak(response)
                else:
                    print(f"[Ignored (No wake word detected)]: {text}")
            except Exception as e:
                print(f"[Voice Loop Error]: {e}")
                time.sleep(1)  # Prevent tight error loops

    def start_background_thread(self, chat_callback):
        """Starts the voice assistant in a plain daemon thread.
        No asyncio — fully compatible with Gunicorn/Eventlet.
        """
        thread = threading.Thread(
            target=self.listen_loop,
            args=(chat_callback,),
            daemon=True,
            name="VoiceListenerThread"
        )
        thread.start()
        print("[Voice Engine thread started successfully (sync mode)]")
        return thread
