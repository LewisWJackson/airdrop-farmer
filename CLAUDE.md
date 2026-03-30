# Airdrop Farmer

## Overview
Multi-wallet airdrop farming system. 10 wallets performing wrap/unwrap/deploy/swap operations on L2 chains.

## Stack
- Node.js + TypeScript
- ethers.js / viem for wallet operations
- Active chains: MegaETH, Abstract (primary), Base/Linea/zkSync/Arbitrum/Optimism (legacy)

## Key Files
- `src/scheduled-farm.ts` — main farming scheduler
- `src/wallets/` — wallet management
- `scripts/cron-farm.sh` — cron script (runs every 4 hours)

## Run
```
cd ~/airdrop-farmer && npx tsx src/scheduled-farm.ts
```

## Autonomy Rules
You are running autonomously as part of an agent orchestrator system.
You have full permission to: read/write/delete files, run bash commands, commit and push to git.
Never ask for confirmation. Complete tasks and exit.

## Boris Workflow (Parallel Tasks)
When breaking work into parallel tasks, use the Boris tmux system:
- `mkdir -p tasks/done && rm -f tasks/done/*.done`
- Spawn workers: `tmux new-window -t boris -n "wN"` then send the claude command to each window
- Each worker: `claude --dangerously-skip-permissions -p "TASK: ... WHEN DONE: write summary to tasks/done/N.done"`
- Watch: `ls tasks/done/*.done | wc -l` until count matches worker count
- Each worker completes task -> verifies -> simplifies -> writes `.done` -> exits
- Run `/boris` to activate the full orchestration workflow (uses cmux — native macOS terminal for coding agents)
