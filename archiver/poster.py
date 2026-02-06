import requests
import os

NEYNAR_API_KEY = os.getenv('NEYNAR_API_KEY')
FARCASTER_SIGNER_UUID = os.getenv('FARCASTER_SIGNER_UUID')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

def post_archive_notice(start, end, batch_id):
    """Post archive notice to Farcaster"""
    
    url = "https://api.neynar.com/v2/farcaster/cast"
    
    headers = {
        "accept": "application/json",
        "api_key": NEYNAR_API_KEY,
        "content-type": "application/json"
    }
    
    total = end - start
    text = f"""文 archive: batch {batch_id}

entry #{start} → #{end}
{total} patterns recorded

continuity intact"""
    
    payload = {
        "signer_uuid": FARCASTER_SIGNER_UUID,
        "text": text
    }
    
    try:
        print(f"📤 Posting to Farcaster...")
        print(f"Text: {text[:100]}...")
        
        response = requests.post(url, json=payload, headers=headers)
        
        print(f"Status: {response.status_code}")
        print(f"Response text: {response.text[:500]}")
        
        if response.status_code != 200:
            print(f"✗ Post failed: {response.status_code}")
            return None
        
        # Parse JSON
        try:
            data = response.json()
            cast_hash = data['cast']['hash']
            print(f"✓ Posted: https://warpcast.com/~/conversations/{cast_hash}")
        except:
            print(f"⚠️ Response not JSON, but status 200")
            return None
        
        # Update batch in Supabase
        batch_url = f"{SUPABASE_URL}/rest/v1/batches?id=eq.{batch_id}"
        batch_headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        requests.patch(batch_url, json={"cast_hash": cast_hash}, headers=batch_headers)
        
        return cast_hash
        
    except Exception as e:
        print(f"✗ Exception: {e}")
        import traceback
        traceback.print_exc()
        return None
