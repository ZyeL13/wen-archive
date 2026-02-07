"""
scheduler.py
Pattern-only posting scheduler for 文

Posts only when interesting patterns are detected, not on fixed schedules
"""

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
from pattern_analyzer import (
    analyze_recent_patterns,
    should_post_now,
    generate_pattern_post_text
)

INTERVAL_HOURS = 12


def archive_job(force_post=False):
    """
    Main archiving job with pattern-based posting
    
    Args:
        force_post: Override pattern detection and post anyway
    """
    
    print(f"\n=== 文 Archive Job - {datetime.now()} ===")

    try:
        # 1. Fetch casts
        casts = fetch_channel_casts()
        if not casts:
            print("No casts to process")
            return

        # 2. Process with LLM extraction
        patterns = process_casts(casts)
        
        if not patterns:
            print("⚠️ No patterns extracted")
            return

        # 3. Save to database
        save_patterns(patterns)

        # 4. Check unarchived count
        count = get_unarchived_count()
        print(f"Unarchived patterns: {count}")

        # 5. Pattern-based posting decision
        if force_post:
            print("📤 Force post mode - bypassing pattern check")
            should_post = True
            post_reason = "manual override"
            analysis = analyze_recent_patterns(hours=12)
        else:
            # Check if patterns are significant
            should_post, post_reason, analysis = should_post_now(
                min_patterns=100,  # Minimum data needed
                analysis_hours=12
            )
        
        print(f"Post decision: {should_post}")
        print(f"Reason: {post_reason}")
        
        if should_post and count >= 100:
            # Create batch
            end = count
            start = max(0, end - min(count, 500))
            
            try:
                batch_id = create_batch(start, end)
                print(f"✓ Created batch {batch_id} ({start}–{end})")
                
                # Generate pattern-aware post text
                post_text = generate_pattern_post_text(analysis, batch_id, start, end)
                
                print(f"\nPost preview:")
                print("---")
                print(post_text)
                print("---\n")
                
                # Post to Farcaster
                post_archive_notice(
                    start, 
                    end, 
                    batch_id, 
                    custom_text=post_text
                )
                
            except Exception as e:
                print(f"✗ Batch/post error: {e}")
                import traceback
                traceback.print_exc()
        
        elif should_post and count < 100:
            print(f"⚠️ Patterns detected but insufficient data ({count}/100)")
        else:
            print("✓ Archive complete, no significant patterns detected")

    except KeyboardInterrupt:
        raise
    except Exception as e:
        print(f"✗ Job error: {e}")
        import traceback
        traceback.print_exc()
    
    print("=== Complete ===\n")


# Command line arguments
if len(sys.argv) > 1:
    arg = sys.argv[1]
    
    if arg == '--post':
        print("📤 Force post mode enabled")
        archive_job(force_post=True)
        sys.exit(0)
    
    elif arg == '--test-patterns':
        print("🔍 Testing pattern detection\n")
        from pattern_analyzer import analyze_recent_patterns, detect_pattern_significance
        
        analysis = analyze_recent_patterns(hours=12)
        if analysis:
            is_sig, reasons, score = detect_pattern_significance(analysis)
            print(f"Significant: {is_sig}")
            print(f"Score: {score}")
            print(f"Reasons:")
            for r in reasons:
                print(f"  - {r}")
        else:
            print("No patterns to analyze")
        
        sys.exit(0)
    
    elif arg == '--help':
        print("""
文 Archive Scheduler

Usage:
  python scheduler.py              # Run normal loop (archive + pattern-based posting)
  python scheduler.py --post       # Force post (bypass pattern check)
  python scheduler.py --test-patterns  # Test pattern detection without posting

Pattern-Only Mode:
  文 only posts when interesting patterns are detected.
  No fixed schedules, no monotonous posting.
  Patterns include: hashtag trends, mention clustering, volume spikes, etc.
        """)
        sys.exit(0)

# Run once immediately
try:
    archive_job(force_post=False)
except KeyboardInterrupt:
    print("\n⚠️ Interrupted by user")
    sys.exit(0)

# Loop mode
print(f"文 archiver running (pattern-only mode)")
print(f"Archive interval: every {INTERVAL_HOURS} hours")
print(f"Posting: only when patterns detected")
print(f"\nCommands:")
print(f"  --post            Force post now")
print(f"  --test-patterns   Check current patterns")
print(f"  Ctrl+C            Stop archiver\n")

try:
    while True:
        time.sleep(INTERVAL_HOURS * 3600)
        archive_job(force_post=False)
except KeyboardInterrupt:
    print("\n✓ Archiver stopped")
    sys.exit(0)
