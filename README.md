# Shubham AI - Futuristic Jarvis-Style Personal Assistant

Shubham AI is a futuristic, voice-first intelligent companion that operates on a hybrid mix of Marathi and English (code-switched language). It manages tasks, stores memories, controls browser searches via Selenium, automates WhatsApp Web messages, launches local PC programs, and compiles fully customized static websites on-demand.

## Core Features

1. **Dual Voice Channel**: 
   - **Continuous Wake Word**: Backend python listener waiting for *"Hey Buddy"* using SpeechRecognition and Whisper/Google Speech fallback.
   - **HUD Microphone Widget**: Integrated Web Speech API in the browser for latency-free voice inputs.
2. **Marathi + English (Marathish)**: Communicates naturally with custom prompt engineering using a friendly buddy persona.
3. **Daily Planner**: SQLite-backed scheduler accessible via API.
4. **Cognitive Memory**: Persistent SQLite long-term storage of user facts, deadlines, and project details.
5. **WhatsApp & Web Automation**: Automated Selenium chrome instance. Remembers sessions so you only log in/scan QR code once.
6. **Local PC Controller**: Launches desktop apps like Notepad, Calculator, Chrome, and File Explorer.
7. **AI Website Engine**: Translates user design prompts into fully coded web files (HTML, CSS, JS) served statically by Flask.
8. **Mobile Synchronization**: Flask serves static bindings to `0.0.0.0`, allowing mobile devices on the same Wi-Fi network to control the dashboard and planner.

---

## Folder Structure

```text
Shubham-AI/
├── backend/
│   ├── app.py                  # Flask entrypoint (Rest APIs + Static servers)
│   ├── config.py               # API keys, DB configurations, download dirs
│   ├── database.py             # SQLite DB driver (Memory, Planner, History logs)
│   ├── services/
│   │   ├── ai_service.py       # OpenAI GPT-4o Intent classification & dialogue
│   │   ├── voice_service.py    # Speech-to-text (Whisper) & TTS (ElevenLabs/gTTS/pyttsx3)
│   │   ├── automation.py       # WhatsApp Web & Chrome Selenium control + Windows shell runner
│   │   └── site_generator.py   # AI web compiler (writes HTML/CSS/JS to disk)
│   └── requirements.txt        # Python backend package list
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JarvisCore.jsx  # Concentric rotating SVG reactor rings with dynamic states
│   │   │   ├── Planner.jsx     # Daily tasks planner interface
│   │   │   ├── SiteBuilder.jsx # Prompt-to-web generator controller
│   │   │   ├── Console.jsx     # Diagnostic scroll logs terminal
│   │   │   └── StatusPanel.jsx # Server, voice listener, and sync metrics
│   │   ├── App.jsx
│   │   └── index.css           # Glassmorphism panels, dark neon themes, keyframe animations
│   ├── package.json
│   └── vite.config.js          # Port forwarding proxy configuration
└── run.py                      # Multi-process script runner
```

---

## Getting Started

### 1. Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **Google Chrome** (needed for Selenium automation)

### 2. Install Python Dependencies
Run the following command at the root of the project:
```bash
pip install -r backend/requirements.txt
```
*(If PyAudio installation fails on Windows, install `pipwin` and install it, or download the precompiled wheel. Offline fallbacks don't strictly require PyAudio if you use the frontend microphone widget!)*

### 3. Supply API Keys (Optional)
Fill in your credentials inside `backend/.env`. If left empty, Shubham AI uses offline rule-based fallbacks for chat, browser recognition for voice, and local pyttsx3/gTTS for speech synthesis!

### 4. Launch the System
Start both backend API and React dashboard simultaneously using:
```bash
python run.py
```
Open **[http://localhost:5173](http://localhost:5173)** in Chrome!

---

## Diagnostic Actions to Try

- **Greeting**: Click the glowing Core, say *"नमस्कार मित्रा कसा आहेस?"* or *"How are you, buddy?"*
- **App Opening**: Say *"Open Calculator"* or *"Notepad उघड"*
- **Search**: Say *"Google Search best python modules"*
- **Memory**: Say *"Remember that my React app showcase is on June 15th"*, then later ask *"What do you remember about my showcase?"*
- **Planner**: Say *"Add a task to read documentation tonight at 9 PM"*
- **WhatsApp**: Say *"Send WhatsApp to John: Hello friend"* (Scan QR code on Chrome popup browser once, then it stays logged in!)
- **AI Web Builder**: Open the Web Engine panel in the UI, input project name `bakery_web`, describe the site prompt, and click compile to instantly preview!
