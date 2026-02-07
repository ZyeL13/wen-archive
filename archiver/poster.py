import requests
import os
import json

NEYNAR_API_KEY = os.getenv('NEYNAR_API_KEY')
FARCASTER_SIGNER_UUID = os.getenv('FARCASTER_SIGNER_UUID')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

def post_archive_notice(start, end, batch_id, custom_text=None):
    """Post archive notice to Farcaster"""
    
    url = "https://api.neynar.com/v2/farcaster/cast"
    
    headers = {
        "accept": "application/json",
        "api_key": NEYNAR_API_KEY,
        "content-type": "application/json"
    }
    
    # Use custom text if provided, otherwise generate default
    if custom_text:
        text = custom_text
    else:
        total = end - start
        text = f"""文 · batch {batch_id}

{total} patterns
#{start}–#{end}"""
    
    payload = {
        "signer_uuid": FARCASTER_SIGNER_UUID,
        "text": text
    }
    
    try:
        print(f"📤 Posting to Farcaster...")
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 402:
            print("⚠️ Neynar requires payment - posting disabled")
            return None
        
        if response.status_code not in [200, 201]:
            print(f"✗ Post failed: {response.text[:300]}")
            return None
        
        # Parse response
        try:
            data = response.json()
            cast_hash = data['cast']['hash']
        except (KeyError, json.JSONDecodeError):
            print("⚠️ Response format unexpected")
            return None
        
        print(f"✓ Posted: https://warpcast.com/~/conversations/{cast_hash}")
        
        # Update batch with cast_hash
        batch_url = f"{SUPABASE_URL}/rest/v1/batches?id=eq.{batch_id}"
        batch_headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        requests.patch(
            batch_url, 
            json={"cast_hash": cast_hash}, 
            headers=batch_headers
        )
        
        return cast_hash
        
    except requests.exceptions.Timeout:
        print("✗ Request timeout")
        return None
    except Exception as e:
        print(f"✗ Post error: {e}")
        return None
