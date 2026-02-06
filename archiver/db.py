import requests
from config import SUPABASE_URL, SUPABASE_KEY

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# -----------------------------
# Save / Upsert patterns
# -----------------------------
def save_patterns(patterns):
    """
    Save patterns via REST API (upsert on cast_hash)
    """
    url = f"{SUPABASE_URL}/rest/v1/patterns?on_conflict=cast_hash"
    try:
        response = requests.post(
            url,
            json=patterns,
            headers=headers
        )
        response.raise_for_status()
        print(f"✓ Saved {len(patterns)} patterns (upsert)")
        return True
    except Exception as e:
        print(f"✗ Database error: {e}")
        return False


# -----------------------------
# Count unarchived patterns
# -----------------------------
def get_unarchived_count():
    """
    Count patterns without batch_id
    """
    url = f"{SUPABASE_URL}/rest/v1/patterns?batch_id=is.null&select=id"
    resp = requests.get(url, headers={**headers, "Prefer": "count=exact"})
    count = int(resp.headers.get('Content-Range', '0-0/0').split('/')[-1])
    return count


# -----------------------------
# Create batch & assign patterns
# -----------------------------
def create_batch(start, end):
    """
    Create batch and assign patterns
    """
    # 1️⃣ Create batch
    batch_url = f"{SUPABASE_URL}/rest/v1/batches"
    batch_data = {
        "start_entry": start,
        "end_entry": end,
        "total_patterns": end - start
    }
    resp = requests.post(
        batch_url,
        json=[batch_data],
        headers={**headers, "Prefer": "return=representation"}
    )
    resp.raise_for_status()
    batch_id = resp.json()[0]['id']
    print(f"✓ Created batch {batch_id} ({start}–{end})")

    # 2️⃣ Assign patterns in this batch
    pattern_url = f"{SUPABASE_URL}/rest/v1/patterns?batch_id=is.null&limit=500"
    resp2 = requests.patch(
        pattern_url,
        json={"batch_id": batch_id},
        headers=headers
    )
    resp2.raise_for_status()
    print(f"✓ Assigned {len(resp2.json())} patterns to batch {batch_id}")

    return batch_id


# -----------------------------
# Mark batch as posted
# -----------------------------
def mark_batch_posted(batch_id, post_hash):
    """
    Update batch with post_hash
    """
    batch_url = f"{SUPABASE_URL}/rest/v1/batches?id=eq.{batch_id}"
    resp = requests.patch(
        batch_url,
        json={"post_hash": post_hash},
        headers=headers
    )
    resp.raise_for_status()
    print(f"✓ batch {batch_id} marked as posted")
