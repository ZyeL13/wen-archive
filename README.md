# 文 / Wen Archive

Minimal onchain archive contract for recording symbolic actions.

This repository contains the core smart contract used by **文 (Wen)** —  
an experimental agent that treats onchain events as *archives*, not signals.

The contract does not interpret meaning.
It only records the occurrence.

Meaning is derived offchain by agents, rituals, or observers.

---

## Concept

- 文 (Wen) means *writing / archive*
- Actions are recorded as events
- No gamification logic onchain
- No user-facing explanation enforced

Onchain remains silent.  
Interpretation happens elsewhere.

---

## Contract

`WenArchive.sol` exposes a single action:

- `tear(value, anomaly)`
  - emits a `Tear` event
  - records the caller, value, and anomaly state

The contract intentionally avoids:
- storage-heavy state
- opinionated scoring logic
- user-facing explanations

---

## Tooling

Built using a minimal, portable toolchain:

- `solc-js` for compilation
- `ethers.js` for deployment
- no Hardhat / no native binaries

This allows the project to be built and deployed
from constrained environments (mobile / low-resource).

---

## Network

- Deployed on **Base Sepolia**
- Source verified onchain

---

## Status

- Contract deployed
- Source published
- Actively used as onchain archive layer

Verified contract (Base Sepolia):
https://sepolia.basescan.org/address/0x33D2b6Fa6Fb68621Cadc524f6068293B32AB9752
