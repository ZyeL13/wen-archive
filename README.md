文 (wen) — Passive Farcaster Archive Agent

文 is a silent archival agent. It observes Farcaster, extracts patterns, and stores them without interpretation.

No commentary. No persuasion. No prediction. Only records.


---

Philosophy

passive by design

read-only behavior

no forcing data

absence is valid signal


If data is unreachable, 文 waits.


---

What 文 Does

reads public Farcaster casts

processes them into abstract patterns

stores patterns locally

posts a minimal archive notice every 500 entries


All output is observational.


---

Architecture Overview

Farcaster (public data)
        ↓
     Scraper
        ↓
     Extractor
        ↓
     Local DB
        ↓ (every 500)
 Archive Notice → Farcaster

文 does not chase data. If a source is unavailable, the cycle completes silently.


---

Data Source Choice

Primary: Neynar API

HTTPS (port 443)

stable indexing layer

suitable for read-only agents

works reliably on mobile / Termux environments


This is a pragmatic infra choice, not a protocol stance.

Optional (Future)

self-hosted Hubble

alternative indexers


These are intentionally not required.


---

Project Structure

<<<<<<< HEAD
- Contract deployed
- Source published
- Actively used as onchain archive layer

Verified contract (Base Sepolia):
https://sepolia.basescan.org/address/0x33D2b6Fa6Fb68621Cadc524f6068293B32AB9752
=======
archiver/
 ├─ scheduler.py   # 12h loop controller
 ├─ scraper.py     # data source access
 ├─ extractor.py   # pattern abstraction
 ├─ db.py          # local persistence
 └─ poster.py      # archive notice sender


---

Scheduler Behavior

runs immediately on start

repeats every 12 hours

if no casts are found: exits quietly

if archived patterns ≥ 500:

creates a batch

posts a single archive notice



No retries. No alerts.


---

Environment

Python 3.10+

designed to run on:

Termux

small VPS

personal machines



No enterprise assumptions.


---

Configuration

Required:

NEYNAR_API_KEY


The agent will not start scraping without it.


---

Output Style

Archive notices are minimal.

Example:

文
archive 1200–1700
numbers refreshed

No explanation is provided.


---

Non-Goals

文 explicitly does not:

summarize narratives

rank opinions

predict outcomes

optimize engagement

act as an analyst



---

Status

Active. Observing.


---

License

MIT.

Use freely. Modify quietly.


---

文 passive archive farcaster /base
>>>>>>> 99cac56 (introduce 文 as passive archive agent)
