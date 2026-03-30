#!/bin/bash
# Jackson Airdrop Farm — Cron wrapper
# Alternative to PM2: add to crontab with:
# 0 8,14,20 * * * /path/to/jackson-airdrop-farm/scripts/cron-farm.sh
cd "$(dirname "$0")/.."
npx tsx src/scheduled-farm.ts >> logs/farm.log 2>&1
