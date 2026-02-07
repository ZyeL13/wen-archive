import requests
import json
import time
from config import GROQ_API_KEY, MODEL, SYSTEM_PROMPT

def extract_entities(cast_text):
    """Extract entities using Groq with error handling"""
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Extract entities:\n\n{cast_text}"}
        ],
        "temperature": 0,
        "max_tokens": 500
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        # Rate limit handling
        if response.status_code == 429:
            print(f"⏳ rate limited, sleeping 5s")
            time.sleep(5)
            return {"hashtags": [], "mentions": [], "urls": []}
        
        response.raise_for_status()
        
        data = response.json()
        content = data['choices'][0]['message']['content']
        
        # Clean markdown code blocks if present
        content = content.strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        # Parse JSON
        result = json.loads(content)
        
        return {
            "hashtags": result.get("hashtags", []),
            "mentions": result.get("mentions", []),
            "urls": result.get("urls", [])
        }
        
    except requests.exceptions.RequestException as e:
        print(f"⚠️ LLM request error: {e}")
        return {"hashtags": [], "mentions": [], "urls": []}
    except json.JSONDecodeError as e:
        print(f"⚠️ LLM skip: JSON parse error")
        return {"hashtags": [], "mentions": [], "urls": []}
    except Exception as e:
        print(f"⚠️ LLM skip: {e}")
        return {"hashtags": [], "mentions": [], "urls": []}


def process_casts(casts):
    """Process casts with rate limiting"""
    
    processed = []
    
    for i, cast in enumerate(casts):
        # Rate limit protection: pause every 10 requests
        if i > 0 and i % 10 == 0:
            print(f"⏳ rate limit protection, sleeping 2s")
            time.sleep(2)
        
        # Get cast text safely
        text = cast.get('text', '') or ''
        
        # Skip empty casts
        if not text.strip():
            continue
        
        # Extract entities
        entities = extract_entities(text)
        
        pattern = {
            "cast_hash": cast['hash'],
            "author_fid": cast['author']['fid'],
            "author_username": cast['author'].get('username', 'unknown'),
            "content": text,
            "entities": entities,
            "timestamp": cast['timestamp']
        }
        
        processed.append(pattern)
    
    print(f"✓ processed {len(processed)} patterns")
    return processed
