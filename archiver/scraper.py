import os
import time
import requests

NEYNAR_API_KEY = os.getenv("NEYNAR_API_KEY")
if not NEYNAR_API_KEY:
    raise RuntimeError("NEYNAR_API_KEY not set")

BASE_URL = "https://api.neynar.com/v2/farcaster/feed/user/casts"

# fid sources (observer set)
FIDS = [
    1020,
    12,
    3,
    99,
    18723,
    5650,
    1606,
    7464,
    846887,
    1725,
]

LIMIT = 50          # max per request (credit-efficient)
SLEEP_SEC = 0.3     # soft throttle

HEADERS = {
    "api_key": NEYNAR_API_KEY,
}

def fetch_casts_by_fid(fid, max_pages=5):
    casts = []
    cursor = None
    page = 0
    backoff = 2  # seconds

    while page < max_pages:
        params = {
            "fid": fid,
            "limit": LIMIT,
            "include_replies": False,
        }
        if cursor:
            params["cursor"] = cursor

        try:
            r = requests.get(
                BASE_URL,
                headers=HEADERS,
                params=params,
                timeout=20
            )

            if r.status_code == 429:
                print(f"⏳ rate limited on fid {fid}, sleeping {backoff}s")
                time.sleep(backoff)
                backoff = min(backoff * 2, 30)
                break  # stop this fid, move on

            r.raise_for_status()
            data = r.json()

        except Exception as e:
            raise e

        items = data.get("casts", [])
        casts.extend(items)

        cursor = data.get("next", {}).get("cursor")
        if not cursor or not items:
            break

        page += 1
        time.sleep(SLEEP_SEC)

    return casts


def fetch_channel_casts():
    """
    Main entry used by scheduler.
    Returns merged casts from multiple fids.
    """
    all_casts = []
    seen_hashes = set()

    for fid in FIDS:
        try:
            fid_casts = fetch_casts_by_fid(fid)
            print(f"✓ fid {fid}: {len(fid_casts)} casts")

            for c in fid_casts:
                h = c.get("hash")
                if h and h not in seen_hashes:
                    seen_hashes.add(h)
                    all_casts.append(c)

        except Exception as e:
            print(f"✗ fid error {fid}: {e}")

    print(f"✓ total casts archived: {len(all_casts)}")
    return all_casts
