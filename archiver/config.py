import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
NEYNAR_API_KEY = os.getenv('NEYNAR_API_KEY')
FARCASTER_KEY = os.getenv('NEYNAR_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
FARCASTER_SIGNER_UUID = os.getenv('FARCASTER_SIGNER_UUID')

# Farcaster Config
CHANNEL_ID = "/base"
FETCH_LIMIT = 100
BATCH_SIZE = 500
SCRAPE_INTERVAL = 12

# LLM Config
MODEL = "llama-3.3-70b-versatile"
SYSTEM_PROMPT = """You are 文 (Wen), a passive archival agent.

Extract entities from Farcaster casts. No interpretation.

Output only valid JSON:
{
  "hashtags": ["tag1"],
  "mentions": ["@user"],
  "urls": ["https://..."]
}

If none found, return empty arrays."""
