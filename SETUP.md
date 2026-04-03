# Claude Code Setup Guide

This guide uses Claude Code as an interactive setup assistant. Claude will run each step, check for errors, and ask you to confirm before proceeding. You stay in control throughout.

**How to use:**
1. Open your terminal and run: `claude`
2. Copy the prompt below and paste it in
3. Claude will walk you through each step, pausing for your input at key points

---

```
I want to set up the Jackson Airdrop Farm — an open-source, multi-wallet on-chain activity system for MegaETH, Abstract, and Unichain. The source code is at https://github.com/jackson-video-resources/Jackson-airdrop-farmer and I want to run it on my own machine or Railway account.

Please follow these steps in order. Check for errors at each step and fix them before continuing. Give me a clear status update after each step completes.

---

## STEP 1 — Check Prerequisites

Check whether the following tools are installed at the correct versions.

**Node.js**
Run: `node --version`
- Version 20 or higher: continue
- Below 20 or missing:
  - Mac: `brew install node` (if Homebrew missing: install from brew.sh first)
  - Linux/WSL: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`
  - Windows: download Node.js 20 LTS from nodejs.org, then re-open terminal
  - Ask me to confirm Node is updated before continuing

**Git**
Run: `git --version`
- Missing on Mac: `brew install git`
- Missing on Linux/WSL: `sudo apt-get install -y git`

**Railway CLI**
Run: `railway --version`
- Missing: `npm install -g @railway/cli`

Print a summary of all three versions once confirmed.

---

## STEP 2 — Clone the Repository

```bash
git clone https://github.com/jackson-video-resources/Jackson-airdrop-farmer.git jackson-airdrop-farm
cd jackson-airdrop-farm
```

If the clone fails, report the exact error.

---

## STEP 3 — Install Dependencies

```bash
npm install
```

This installs ethers.js, TypeScript, and all other dependencies (~30–60 seconds).

If it fails due to a Node.js version issue, check `node --version` again (must be 20+).

---

## STEP 4 — Generate Encryption Key and Configure Environment

The encryption key protects wallet private keys at rest on disk. It stays on your machine and is never sent anywhere.

Run this to generate a secure random key and create the .env file:

```bash
ENCKEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") && cat > .env << ENVEOF
ENCRYPTION_KEY=$ENCKEY
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ENVEOF
```

Verify the .env was created correctly (key should be 64 hex characters):

```bash
head -2 .env
```

---

## STEP 5 — Generate 10 Wallets

```bash
npx tsx src/index.ts
```

When the interactive menu appears, select option 1 — Generate Wallet Fleet.
When asked how many wallets, enter 10 (or press Enter for the default).

Show me all 10 wallet addresses (W00 through W09) once generated.

Then display this message:

```
MNEMONIC PHRASE — BACK THIS UP BEFORE CONTINUING

The 12-word mnemonic shown above is the master key to all 10 wallets.
Write it down on paper and store it somewhere safe offline.
If you lose it, you lose access to all airdrop tokens these wallets earn.

Recommended: write it on paper and store it with your other important documents.
Do not screenshot it or store it in a notes app.

Once you've written it down, type YES to continue.
```

Wait for my YES before proceeding.

---

## STEP 6 — Fund the Main Wallet

Display W00's address clearly (the first wallet, index 0) and these instructions:

```
FUND YOUR MAIN WALLET (W00)

Send ETH to this address on Ethereum Mainnet:

  [W00 ADDRESS]

Amount: 0.05 ETH minimum, 0.1 ETH recommended
Network: Ethereum Mainnet (not BSC, not Polygon)

From any exchange (Coinbase, Binance, Kraken, Bybit):
  1. Withdraw / Send
  2. Select ETH
  3. Network: Ethereum (ERC-20)
  4. Paste the address above
  5. Amount: 0.05–0.1 ETH

Confirmation takes 3–5 minutes.
Verify arrival: https://etherscan.io — search the address above.
```

Ask me: "Has the ETH arrived in W00? Type YES when confirmed."
Wait for my YES before proceeding.

---

## STEP 7 — Bridge and Distribute ETH Across Chains

Bridge from W00 on Ethereum mainnet to the farming chains, then distribute to all 10 wallets.

**Fund all chains from W00:**
```bash
npx tsx src/fund-all-chains.ts
```

**Distribute to all wallets:**
```bash
npx tsx src/distribute-wallets.ts
```

**Check balances:**
```bash
npx tsx src/check-all-balances.ts
```

Report: which wallets have balances on which chains. If a bridge hasn't settled yet, wait 2 minutes and check again.

---

## STEP 8 — Set Up Telegram Notifications

Your farmer sends a Telegram message after every farming run. Here's how to connect it:

```
SET UP TELEGRAM (2 minutes)

Step A — Create your bot:
  1. Open Telegram, search for @BotFather
  2. Send: /newbot
  3. Follow prompts — you get a token like: 7891234567:AAHxyz...

Step B — Get your Chat ID:
  1. Search Telegram for @userinfobot
  2. Send: /start
  3. It replies with your numeric ID

Step C — Share both values with me below.
```

Ask me for my BOT_TOKEN and CHAT_ID. Once I provide them, update the .env file with those values.

Then send a test message:

```bash
node -e "
require('dotenv/config');
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
fetch(\`https://api.telegram.org/bot\${token}/sendMessage\`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    chat_id: chatId,
    text: 'Jackson Airdrop Farm — setup test. If you see this, Telegram is connected.',
    parse_mode: 'Markdown'
  })
}).then(r => r.json()).then(d => console.log(d.ok ? 'Telegram connected.' : 'Error: ' + JSON.stringify(d)));
"
```

---

## STEP 9 — Deploy to Railway

Railway is a PaaS host (like Heroku) where you create your own private project. The environment variables below go into your project's encrypted variable vault — they are not shared with anyone.

**Create a Railway account (if you don't have one):**
Tell me to visit https://railway.app and sign up. Wait for my confirmation.

**Log in:**
```bash
railway login
```
This opens a browser window. Log in with GitHub or email.

**Create a Railway project:**
```bash
railway init
```
Use project name: `jackson-airdrop-farm`

**Set environment variables in your Railway project:**
```bash
railway variables set ENCRYPTION_KEY="$(grep ENCRYPTION_KEY .env | cut -d= -f2)"
railway variables set TELEGRAM_BOT_TOKEN="$(grep TELEGRAM_BOT_TOKEN .env | cut -d= -f2)"
railway variables set TELEGRAM_CHAT_ID="$(grep TELEGRAM_CHAT_ID .env | cut -d= -f2)"
railway variables set NODE_ENV=production
WALLET_DATA=$(base64 < data/wallets.enc.json | tr -d '\n')
railway variables set WALLET_DATA_B64="$WALLET_DATA"
```

Note: WALLET_DATA is your AES-256-GCM encrypted wallet file (not raw private keys). The encryption key and wallet data go to your own Railway project — the same way you'd put DATABASE_URL in a .env on your own server.

**Deploy:**
```bash
railway up -d
```

If deployment fails, run `railway logs` and report what you see.

---

## STEP 9 (ALTERNATIVE) — Run Locally with PM2

If you prefer your own machine:

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save
```

Run the command that `pm2 startup` outputs, then verify:
```bash
pm2 list
pm2 logs jackson-airdrop-farm --lines 20
```

---

## STEP 10 — Test Run

```bash
npx tsx src/scheduled-farm.ts
```

This runs one full farming cycle. It should:
1. Load wallets
2. Check balances across all chains
3. Execute tasks (wraps, swaps, deploys)
4. Send a Telegram summary

Report: how many tasks ran, which chains, and whether the Telegram message arrived.

Once you've confirmed at least one successful task, print:

```
Setup complete.

Your 10 wallets are farming MegaETH, Abstract, and Unichain 3x per day.

Check in:
  Telegram: farming summaries every 8 hours
  Balances: npx tsx src/check-all-balances.ts
  Logs (Railway): railway logs
  Logs (PM2): pm2 logs jackson-airdrop-farm

Security checklist:
  - Mnemonic backed up offline
  - .env file not committed to Git
  - Farming wallets hold only farming amounts
```
```

---

## Manual Setup

If you prefer to run each step yourself without Claude Code, see the manual steps in [README.md](README.md).
