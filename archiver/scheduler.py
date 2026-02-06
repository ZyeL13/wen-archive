import time
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from scraper import fetch_channel_casts
from extractor import process_casts
from db import save_patterns, get_unarchived_count, create_batch
from poster import post_archive_notice

INTERVAL_HOURS = 12

def archive_job(should_post=False):
    """Main archiving job"""
    print(f"\n=== 文 Archive Job - {datetime.now()} ===")

    casts = fetch_channel_casts()
    if not casts:
        print("No casts to process")
        return

    patterns = process_casts(casts)
    save_patterns(patterns)

    count = get_unarchived_count()
    print(f"Unarchived patterns: {count}")

    # Only create batch & post if explicitly requested
    if should_post and count >= 500:
        end = count
        start = max(0, end - 500)
        try:
            batch_id = create_batch(start, end)
            print(f"✓ Created batch {batch_id} ({start}–{end})")
            post_archive_notice(start, end, batch_id)
        except Exception as e:
            print(f"✗ Error: {e}")
    elif should_post and count < 500:
        print(f"⚠️ Not enough patterns ({count}/500)")
    
    print("=== Complete ===\n")

# Check if manual post flag is provided
if len(sys.argv) > 1 and sys.argv[1] == "--post":
    print("📤 Manual post mode enabled")
    archive_job(should_post=True)
    sys.exit(0)

# Normal loop (archive only, no posting)
archive_job(should_post=False)

print(f"文 running every {INTERVAL_HOURS}h (archive only). Ctrl+C to stop.")
print("💡 To post manually: python scheduler.py --post")

while True:
    time.sleep(INTERVAL_HOURS * 3600)
    archive_job(should_post=False)
