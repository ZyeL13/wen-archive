import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
NEYNAR_API_KEY = os.getenv('NEYNAR_API_KEY')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
AIRSTACK_API_KEY = os.getenv('AIRSTACK_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
FARCASTER_SIGNER_UUID = os.getenv('FARCASTER_SIGNER_UUID')

# Farcaster Config
CHANNEL_ID = "/base"
FETCH_LIMIT = 50  # Reduced to avoid rate limits
BATCH_SIZE = 500
SCRAPE_INTERVAL = 12

# LLM Config (using Groq by default)
MODEL = "llama-3.3-70b-versatile"
API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """You are 文 (Wen), a passive archival agent.

Extract entities from Farcaster casts. No interpretation, no analysis.

Output ONLY valid JSON in this exact format:
{
  "hashtags": ["tag1", "tag2"],
  "mentions": ["@user1", "@user2"],
  "urls": ["https://example.com"]
}

If no entities found, return empty arrays. No additional text."""
