"""
pattern_analyzer.py
Detects patterns in archived data and determines posting significance

文 only posts when patterns are interesting, not on fixed schedules
"""

import requests
from collections import Counter
from datetime import datetime, timedelta
from config import SUPABASE_URL, SUPABASE_KEY

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}


def analyze_recent_patterns(hours=12):
    """
    Analyze patterns from last N hours
    Returns comprehensive pattern analysis
    """
    
    cutoff = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    
    # Fetch recent patterns
    url = f"{SUPABASE_URL}/rest/v1/patterns?timestamp=gte.{cutoff}&select=*"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        patterns = response.json()
    except Exception as e:
        print(f"⚠️ Pattern fetch error: {e}")
        return None
    
    if not patterns:
        return None
    
    # Extract all entities
    all_hashtags = []
    all_mentions = []
    all_urls = []
    
    for p in patterns:
        entities = p.get('entities', {})
        all_hashtags.extend(entities.get('hashtags', []))
        all_mentions.extend(entities.get('mentions', []))
        all_urls.extend(entities.get('urls', []))
    
    # Count occurrences
    hashtag_counts = Counter(all_hashtags)
    mention_counts = Counter(all_mentions)
    author_counts = Counter(p['author_fid'] for p in patterns)
    
    # Extract domains from URLs
    domains = [extract_domain(url) for url in all_urls if url]
    domain_counts = Counter(d for d in domains if d and d != "unknown")
    
    # Calculate metrics
    total_patterns = len(patterns)
    avg_per_hour = total_patterns / hours if hours > 0 else 0
    unique_authors = len(author_counts)
    
    return {
        "total": total_patterns,
        "avg_per_hour": round(avg_per_hour, 2),
        "unique_authors": unique_authors,
        "trending_hashtags": hashtag_counts.most_common(5),
        "trending_mentions": mention_counts.most_common(5),
        "top_authors": author_counts.most_common(10),
        "top_domains": domain_counts.most_common(5),
        "timeframe_hours": hours,
        "timestamp": datetime.utcnow().isoformat()
    }


def extract_domain(url):
    """Extract domain from URL"""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc.replace('www.', '')
    except:
        return "unknown"


def detect_pattern_significance(analysis):
    """
    Determine if patterns are significant enough to post
    
    Returns: (is_significant: bool, reasons: list, score: int)
    """
    
    if not analysis:
        return False, ["no data"], 0
    
    reasons = []
    score = 0
    
    # 1. Volume spike (20+ patterns per hour)
    if analysis['avg_per_hour'] >= 20:
        reasons.append(f"high volume ({analysis['avg_per_hour']}/h)")
        score += 3
    
    # 2. Strong hashtag clustering (>15 occurrences)
    if analysis['trending_hashtags']:
        top_tag, count = analysis['trending_hashtags'][0]
        if count >= 15:
            reasons.append(f"trending: {top_tag} ({count}x)")
            score += 4
        elif count >= 8:
            reasons.append(f"emerging: {top_tag} ({count}x)")
            score += 2
    
    # 3. Mention clustering (>8 mentions of same user)
    if analysis['trending_mentions']:
        top_mention, count = analysis['trending_mentions'][0]
        if count >= 8:
            reasons.append(f"focus: {top_mention} ({count}x)")
            score += 3
    
    # 4. Author concentration (single author >25% of volume)
    if analysis['top_authors']:
        top_fid, count = analysis['top_authors'][0]
        percentage = (count / analysis['total']) * 100
        if percentage > 25:
            reasons.append(f"fid {top_fid} dominant ({count} casts)")
            score += 2
    
    # 5. Domain clustering (>5 links to same domain)
    if analysis['top_domains']:
        top_domain, count = analysis['top_domains'][0]
        if count >= 5:
            reasons.append(f"links: {top_domain} ({count}x)")
            score += 2
    
    # 6. Multiple diverse patterns (>3 unique hashtags with >5 mentions each)
    diverse_hashtags = sum(1 for tag, count in analysis['trending_hashtags'] if count >= 5)
    if diverse_hashtags >= 3:
        reasons.append(f"diverse topics ({diverse_hashtags} themes)")
        score += 3
    
    # 7. High author diversity (>20 unique authors)
    if analysis['unique_authors'] >= 20:
        reasons.append(f"broad participation ({analysis['unique_authors']} authors)")
        score += 2
    
    # Significance threshold: score >= 6 OR >= 3 criteria met
    is_significant = score >= 6 or len(reasons) >= 3
    
    return is_significant, reasons, score


def generate_pattern_post_text(analysis, batch_id, start, end):
    """
    Generate post text based on detected patterns
    Non-monotonous, pattern-focused
    """
    
    if not analysis:
        # Fallback minimal
        return f"文 · batch {batch_id}\n\n{end - start} patterns\n#{start}–#{end}"
    
    lines = [f"文 · batch {batch_id}", ""]
    
    # Add most significant pattern first
    if analysis['trending_hashtags']:
        tag, count = analysis['trending_hashtags'][0]
        if count >= 15:
            lines.append(f"dominant: {tag} ({count})")
        elif count >= 8:
            lines.append(f"emerging: {tag} ({count})")
    
    # Add secondary patterns (max 2 more)
    added = 0
    
    # Mention if significant
    if analysis['trending_mentions'] and added < 2:
        mention, count = analysis['trending_mentions'][0]
        if count >= 8:
            lines.append(f"focus: {mention} ({count})")
            added += 1
    
    # Domain if significant
    if analysis['top_domains'] and added < 2:
        domain, count = analysis['top_domains'][0]
        if count >= 5:
            lines.append(f"links: {domain} ({count})")
            added += 1
    
    # Author clustering if extreme
    if analysis['top_authors'] and added < 2:
        top_fid, count = analysis['top_authors'][0]
        percentage = (count / analysis['total']) * 100
        if percentage > 30:
            lines.append(f"fid {top_fid} ({count})")
            added += 1
    
    # Volume note if high
    if analysis['avg_per_hour'] >= 25:
        lines.append(f"volume: {analysis['avg_per_hour']}/h")
    
    # Entry range
    lines.append("")
    lines.append(f"#{start}–#{end}")
    
    return "\n".join(lines)


def get_active_fids(hours=24, min_casts=5):
    """
    Automatically detect currently active FIDs
    Returns list of FIDs that posted >= min_casts in last N hours
    """
    
    cutoff = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
    
    url = f"{SUPABASE_URL}/rest/v1/patterns?timestamp=gte.{cutoff}&select=author_fid"
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        patterns = response.json()
        
        if not patterns:
            return []
        
        # Count casts per FID
        fid_counts = Counter(p['author_fid'] for p in patterns)
        
        # Filter by minimum threshold
        active_fids = [fid for fid, count in fid_counts.items() if count >= min_casts]
        
        print(f"✓ Detected {len(active_fids)} active FIDs (last {hours}h, min {min_casts} casts)")
        
        return active_fids
        
    except Exception as e:
        print(f"⚠️ Active FID detection error: {e}")
        return []


def get_target_fids():
    """
    Get target FIDs for scraping
    
    Strategy:
    1. Check for active FIDs in last 24h
    2. If < 10 active, use curated list
    3. Combine both (dedupe)
    """
    
    # Curated high-quality FIDs (your list)
    CURATED_FIDS = [
        12, 194, 1020, 2904, 446697, 1725, 5406, 11388,
        2802, 4167, 2210, 9933, 210698, 7143, 190000,
        864405, 5774, 12152, 4528, 13121, 99, 1606,
        3621, 18723, 436577
    ]
    
    # Get currently active FIDs
    active_fids = get_active_fids(hours=24, min_casts=3)
    
    # Combine (curated first, then active, dedupe)
    combined = []
    seen = set()
    
    for fid in CURATED_FIDS:
        if fid not in seen:
            combined.append(fid)
            seen.add(fid)
    
    for fid in active_fids:
        if fid not in seen:
            combined.append(fid)
            seen.add(fid)
    
    print(f"✓ Target FIDs: {len(combined)} total ({len(CURATED_FIDS)} curated + {len(active_fids)} active)")
    
    return combined


def should_post_now(min_patterns=100, analysis_hours=12):
    """
    Determine if 文 should post right now based on patterns
    
    Args:
        min_patterns: Minimum patterns required before considering
        analysis_hours: Hours to analyze for patterns
    
    Returns:
        (should_post: bool, reason: str, analysis: dict)
    """
    
    # Check if we have enough data
    url = f"{SUPABASE_URL}/rest/v1/patterns?batch_id=is.null&select=id"
    response = requests.get(url, headers={**headers, "Prefer": "count=exact"})
    
    content_range = response.headers.get('Content-Range', '0-0/0')
    unarchived_count = int(content_range.split('/')[-1])
    
    if unarchived_count < min_patterns:
        return False, f"insufficient data ({unarchived_count}/{min_patterns})", None
    
    # Analyze patterns
    analysis = analyze_recent_patterns(hours=analysis_hours)
    
    if not analysis:
        return False, "no analysis data", None
    
    # Check significance
    is_significant, reasons, score = detect_pattern_significance(analysis)
    
    if is_significant:
        reason_str = "; ".join(reasons)
        return True, f"patterns detected (score {score}): {reason_str}", analysis
    else:
        return False, f"patterns not significant (score {score})", analysis


# Debug/test function
if __name__ == "__main__":
    print("=== 文 Pattern Analyzer Test ===\n")
    
    # Test pattern analysis
    analysis = analyze_recent_patterns(hours=12)
    
    if analysis:
        print(f"Total patterns: {analysis['total']}")
        print(f"Avg per hour: {analysis['avg_per_hour']}")
        print(f"Unique authors: {analysis['unique_authors']}")
        
        print("\nTop hashtags:")
        for tag, count in analysis['trending_hashtags']:
            print(f"  {tag}: {count}")
        
        print("\nTop mentions:")
        for mention, count in analysis['trending_mentions']:
            print(f"  {mention}: {count}")
        
        print("\nSignificance check:")
        is_sig, reasons, score = detect_pattern_significance(analysis)
        print(f"  Significant: {is_sig}")
        print(f"  Score: {score}")
        print(f"  Reasons: {', '.join(reasons)}")
    else:
        print("No patterns to analyze")
