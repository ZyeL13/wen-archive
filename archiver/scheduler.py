import time
import os
import sys
from datetime import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from scraper import fetch_channel_casts
from extractor import process_casts
from db import save_patterns, get_unarchived_count, create_batch
from poster import post_archive_notice

INTERVAL_HOURS = 12
TEST_POST = False  # Set True to force post even with < 500

def archive_job(should_post=False):
    """Main archiving job"""
    print(f"\n=== 文 Archive Job - {datetime.now()} ===")

    try:
        # Fetch casts
        casts = fetch_channel_casts()
        if not casts:
            print("No casts to process")
            return

        # Process with LLM
        patterns = process_casts(casts)
        
        if not patterns:
            print("⚠️ No patterns extracted")
            return

        # Save to database
        save_patterns(patterns)

        # Check unarchived count
        count = get_unarchived_count()
        print(f"Unarchived patterns: {count}")

        # Post logic
        if (should_post or TEST_POST) and count >= 500:
            end = count
            start = max(0, end - 500)
            
            try:
                batch_id = create_batch(start, end)
                print(f"✓ Created batch {batch_id} ({start}–{end})")
                
                post_archive_notice(start, end, batch_id)
                
            except Exception as e:
                print(f"✗ Batch/post error: {e}")
                
        elif (should_post or TEST_POST) and count < 500:
            print(f"⚠️ Not enough patterns to post ({count}/500)")

    except KeyboardInterrupt:
        raise
    except Exception as e:
        print(f"✗ Job error: {e}")
        import traceback
        traceback.print_exc()
    
    print("=== Complete ===\n")


# Check for --post flag
if len(sys.argv) > 1 and sys.argv[1] == '--post':
    print("📤 Manual post mode enabled")
    archive_job(should_post=True)
    sys.exit(0)

# Run once immediately
try:
    archive_job(should_post=False)
except KeyboardInterrupt:
    print("\n⚠️ Interrupted by user")
    sys.exit(0)

# Loop mode
print(f"文 archiver running.")
print(f"Will run every {INTERVAL_HOURS} hours.")
print(f"💡 To post manually: python scheduler.py --post")
print(f"Press Ctrl+C to stop.\n")

try:
    while True:
        time.sleep(INTERVAL_HOURS * 3600)
        archive_job(should_post=False)
except KeyboardInterrupt:
    print("\n✓ Archiver stopped")
    sys.exit(0)
