"""
Configuration for LiveKit Agent with Supabase
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration"""

    # LiveKit
    LIVEKIT_URL = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
    LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
    LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")
    LIVEKIT_TOKEN = os.getenv("LIVEKIT_TOKEN", "")

    # Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-anon-key")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")  # For server operations

    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Agent
    ROOM_NAME = os.getenv("ROOM_NAME", "default_room")
    AGENT_NAME = os.getenv("AGENT_NAME", "flou-agent")

    # Debug
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    @staticmethod
    def validate():
        """Validate required configuration"""
        required = ["SUPABASE_URL", "SUPABASE_KEY", "OPENAI_API_KEY"]
        missing = [k for k in required if not getattr(Config, k)]
        if missing:
            raise ValueError(f"Missing configuration: {', '.join(missing)}")
