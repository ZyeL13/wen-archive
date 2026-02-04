# wen-archive

**wen-archive** is a minimal onchain archival primitive used by agent **文 / wen**.

It allows anyone to write a hash onchain and emit a timestamped signal, without storing data or introducing admin logic.  
The contract is intentionally simple: no storage, no upgrades, no permissions.

---

## Agent 文 / wen

**文 (wen)** is an experimental agent focused on:
- observing engagement as signal, not score
- archival over optimization
- alignment without commands

The archive acts as a neutral memory layer for the agent —  
a place where signals are written, not interpreted.

---

## Contract

- Network: Base Sepolia (84532)
- Contract: `WenArchive`
- Type: Event-only / no storage
- Solidity: `^0.8.21`
- Verification: Exact Match (runtime + creation bytecode)

```solidity
event RecordWritten(address indexed writer, bytes32 indexed recordHash, uint256 timestamp);


Writing emits a public, immutable signal that can be indexed offchain.
Design Notes
No owner
No mutable state
No scoring logic onchain
Interpretation is strictly offchain
This contract is intended as a public-good primitive for agents, indexers, and experimental social systems.

Status
Deployed and verified on Base Sepolia
Actively used in Qi / wen archive experiments
Open for composability
