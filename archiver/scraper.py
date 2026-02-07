"""
scraper.py
Fetch casts from target FIDs using Pinata Hub (free, no auth needed)
"""

import requests
import time

PINATA_HUB = "https://hub.pinata.cloud"

def fetch_casts_from_fid(fid, limit=20):
    """Fetch recent casts from a specific FID"""
    
    url = f"{PINATA_HUB}/v1/castsByFid"
    
    params = {
        "fid": fid,
        "pageSize": limit,
        "reverse": True  # newest first
    }
    
    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        messages = data.get('messages', [])
        
        casts = []
        for msg in messages:
            try:
                cast_data = msg.get('data', {}).get('castAddBody', {})
                fid_data = msg.get('data', {}).get('fid', 0)
                
                casts.append({
                    'hash': msg.get('hash', ''),
                    'text': cast_data.get('text', ''),
                    'timestamp': msg.get('data', {}).get('timestamp', ''),
                    'author': {
                        'fid': fid_data,
                        'username': f"fid-{fid_data}"
                    }
                })
            except:
                continue
        
        return casts
        
    except Exception as e:
        print(f"✗ Error fid {fid}: {e}")
        return []


def fetch_channel_casts(limit=50):
    """Fetch from curated FIDs + auto-detected active ones"""
    
    # Your curated high-quality FIDs
    curated_fids = [
        12, 194, 1020, 2904, 446697, 1725, 5406, 11388,
        2802, 4167, 2210, 9933, 210698, 7143, 190000,
        864405, 5774, 12152, 4528, 13121, 99, 1606,
        3621, 18723, 436577
    ]
    
    # Try to get active FIDs from pattern analyzer
    try:
        from pattern_analyzer import get_active_fids
        active_fids = get_active_fids(hours=24, min_casts=3)
    except:
        active_fids = []
    
    # Combine (curated first, then active, dedupe)
    target_fids = []
    seen = set()
    
    for fid in curated_fids:
        if fid not in seen:
            target_fids.append(fid)
            seen.add(fid)
    
    for fid in active_fids:
        if fid not in seen and len(target_fids) < 30:  # max 30 FIDs
            target_fids.append(fid)
            seen.add(fid)
    
    all_casts = []
    per_fid = max(2, min(10, limit // len(target_fids)))
    
    print(f"✓ Fetching from {len(target_fids)} FIDs ({per_fid} casts each)")
    
    for i, fid in enumerate(target_fids):
        casts = fetch_casts_from_fid(fid, limit=per_fid)
        
        if casts:
            print(f"✓ fid {fid}: {len(casts)} casts")
            all_casts.extend(casts)
        
        # Rate limiting (be nice to free API)
        time.sleep(0.3)
    
    # Deduplicate by hash
    seen_hashes = set()
    unique_casts = []
    
    for cast in all_casts:
        if cast['hash'] and cast['hash'] not in seen_hashes:
            unique_casts.append(cast)
            seen_hashes.add(cast['hash'])
    
    print(f"✓ total casts archived: {len(unique_casts)}")
    
    return unique_casts


# Test
if __name__ == "__main__":
    print("=== Testing Pinata Hub Scraper ===\n")
    
    casts = fetch_channel_casts(limit=50)
    
    if casts:
        print(f"\n✓ Success: {len(casts)} casts")
        print(f"Sample: {casts[0]['text'][:100]}")
    else:
        print("\n✗ No casts fetched")
