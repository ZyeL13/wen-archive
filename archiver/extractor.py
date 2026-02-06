import re
import requests
import json
from config import GROQ_API_KEY, SYSTEM_PROMPT

HASHTAG_RE = re.compile(r"#\w+")
MENTION_RE = re.compile(r"@\w+")
URL_RE = re.compile(r"https?://\S+")

def regex_extract(text: str):
    return {
        "hashtags": HASHTAG_RE.findall(text),
        "mentions": MENTION_RE.findall(text),
        "urls": URL_RE.findall(text),
    }

def process_casts(casts):
    processed = []

    for cast in casts:
        text = cast.get("text", "") or ""

        if not cast.get("hash") or not cast.get("author"):
            continue

        pattern = {
            "cast_hash": cast["hash"],
            "author_fid": cast["author"]["fid"],
            "author_username": cast["author"].get("username"),
            "content": text,
            "entities": extract_entities(text),
            "timestamp": cast.get("timestamp"),
        }

        processed.append(pattern)

    print(f"✓ processed {len(processed)} patterns")
    return processed

def llm_extract(text: str):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text}
        ],
        "temperature": 0,
        "max_tokens": 300
    }

    r = requests.post(url, json=payload, headers=headers, timeout=20)
    r.raise_for_status()

    content = r.json()["choices"][0]["message"]["content"]
    return json.loads(content)

def extract_entities(text: str):
    # 1. deterministic first
    entities = regex_extract(text)

    # 2. kalau kosong & cukup panjang → LLM
    if (
        GROQ_API_KEY
        and len(text) > 40
        and not any(entities.values())
    ):
        try:
            llm = llm_extract(text)
            return {
                "hashtags": llm.get("hashtags", []),
                "mentions": llm.get("mentions", []),
                "urls": llm.get("urls", [])
            }
        except Exception as e:
            print(f"⏳ LLM skip: {e}")

    return entities
