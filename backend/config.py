import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default Jarvis-like voice ID (Rachel or similar, can be replaced)

# Database
DB_PATH = os.path.join(BASE_DIR, "instance", "shubham_ai.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

# Generated Sites Directory
SITES_DIR = os.path.join(BASE_DIR, "generated_sites")
os.makedirs(SITES_DIR, exist_ok=True)

# Port
PORT = int(os.getenv("PORT", 5000))
