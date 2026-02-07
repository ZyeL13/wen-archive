import requests
from config import SUPABASE_URL, SUPABASE_KEY

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def save_patterns(patterns):
    """Save patterns to Supabase (skip duplicates)"""
    
    if not patterns:
        print("⚠️ No patterns to save")
        return True
    
    url = f"{SUPABASE_URL}/rest/v1/patterns"
    
    # Get existing cast hashes to avoid duplicates
    existing_url = f"{SUPABASE_URL}/rest/v1/patterns?select=cast_hash"
    
    try:
        existing_response = requests.get(existing_url, headers=headers)
        existing_hashes = set(p['cast_hash'] for p in existing_response.json())
        
        # Filter out duplicates
        new_patterns = [p for p in patterns if p['cast_hash'] not in existing_hashes]
        
        if not new_patterns:
            print("⚠️ No new patterns (all duplicates)")
            return True
        
        # Insert only new patterns
        response = requests.post(url, json=new_patterns, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"✓ Saved {len(new_patterns)} new patterns (skipped {len(patterns) - len(new_patterns)} duplicates)")
            return True
        else:
            print(f"✗ Database error: {response.status_code}")
            print(f"Response: {response.text[:300]}")
            return False
            
    except Exception as e:
        print(f"✗ Database error: {e}")
        return False


def get_unarchived_count():
    """Count unarchived patterns"""
    
    url = f"{SUPABASE_URL}/rest/v1/patterns?batch_id=is.null&select=id"
    
    try:
        response = requests.get(url, headers={**headers, "Prefer": "count=exact"})
        
        # Parse count from Content-Range header
        content_range = response.headers.get('Content-Range', '0-0/0')
        count = int(content_range.split('/')[-1])
        
        return count
        
    except Exception as e:
        print(f"✗ Count error: {e}")
        return 0


def create_batch(start, end):
    """Create batch and assign patterns"""
    
    # Insert batch
    batch_url = f"{SUPABASE_URL}/rest/v1/batches"
    batch_data = {
        "start_entry": start,
        "end_entry": end,
        "total_patterns": end - start
    }
    
    try:
        response = requests.post(
            batch_url, 
            json=[batch_data], 
            headers={**headers, "Prefer": "return=representation"}
        )
        
        if response.status_code not in [200, 201]:
            raise Exception(f"Batch creation failed: {response.status_code}")
        
        batch_id = response.json()[0]['id']
        
        # Update patterns with batch_id (limit to 500)
        pattern_url = f"{SUPABASE_URL}/rest/v1/patterns?batch_id=is.null&limit=500"
        requests.patch(
            pattern_url, 
            json={"batch_id": batch_id}, 
            headers=headers
        )
        
        return batch_id
        
    except Exception as e:
        print(f"✗ Batch creation error: {e}")
        raise
