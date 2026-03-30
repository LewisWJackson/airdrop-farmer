# "I Built an AI Airdrop Farmer That Runs 24/7 (Full Setup Tutorial)"
## Complete Video Outline — Jackson Airdrop Farm

**Total runtime target:** 50–55 minutes
**Format:** Masterclass / screen-recorded tutorial. Lewis talks to camera at open and close. All technical sections are screen-recorded with voiceover.
**Audience:** Crypto-curious, some technical. Has heard of airdrops, may not know how to set up anything more complex than a MetaMask wallet.

---

## SECTION 1 — HOOK & INTRO [0:00–3:00] (3 min)
**Format:** Talking head, camera

### What Lewis shows:
- Phone screen: Telegram notifications coming in from the farmer bot, timestamped through the night
- Terminal window (30 seconds of fast-forward) showing farming activity across multiple wallets

### Key talking points:
- "While I was sleeping last night, this system made 47 on-chain transactions across 10 wallets, on three different blockchains. I didn't touch my computer once."
- Tease the punchline: "There's a $500M airdrop window open right now and almost nobody is farming it correctly."
- "This video is a complete setup tutorial. By the end you'll have 10 wallets running automatically, farming the chains most likely to airdrop tokens in 2026. And I'm going to give you a file at the end that sets up almost the entire thing with one paste into your terminal."
- Brief credential: "I'm Lewis, I've been building crypto tools for two years and I've personally collected from Arbitrum, zkSync, and Abstract airdrops — this system is how I scaled that up."

### Where feedback improvement lands:
- [FEEDBACK #3] Tease the profit mechanics now so viewers stay: "I'll show you exactly how airdrops work and what a realistic return looks like — including a math breakdown."

---

## SECTION 2 — WHAT IS AN AIRDROP? (THE PROFIT MECHANICS) [3:00–9:00] (6 min)
**Format:** Screen share — browser, simple diagrams, and real airdrop examples

### [FEEDBACK #3 — Full treatment here]

### What Lewis shows:
- Arbitrum airdrop announcement page / ARB token chart at launch
- zkSync airdrop criteria list
- Abstract chain "upcoming airdrop" page or community announcement
- Simple diagram: User interacts with chain → Chain logs wallet history → Airdrop day: snapshot → eligible wallets get tokens → tokens worth real money

### Key talking points:
- **How airdrops work in plain English:** "New blockchain networks want users. Before they release their own token, they want thousands of wallets doing real transactions on their chain — so it looks busy and attracts investors. On airdrop day, they take a snapshot of every wallet that used the chain and give them free tokens proportional to how active they were."
- **The three metrics every chain cares about:**
  1. Transaction count — how many times you interacted
  2. Contract diversity — did you use multiple protocols (DEX swaps, lending, bridges)?
  3. Time span — were you active over months, not just one burst?
- **Real numbers:** "Arbitrum airdrop — average eligible wallet received around $2,000–$4,000 worth of ARB. zkSync — average around $800. The outliers who had 10 wallets and 6 months of activity collected $15,000–$40,000 from a single airdrop."
- **The three chains we're targeting right now and why:**
  - MegaETH: Backed by Vitalik, fully EVM-compatible, no token yet. Very early activity window.
  - Abstract: Backed by Pudgy Penguins team and major VCs, no token yet. Strong consumer NFT angle.
  - Unichain: Official Uniswap chain. Uniswap has never done a token airdrop on L2s — this could be the one.
- **What this system does:** "10 wallets, each doing wrap/unwrap/swap/deploy sequences randomly so they look human. 3 times a day, automatically. For months."

### Math breakdown:
- "Let's say only one of these three chains does an airdrop. Conservative estimate: 500 transactions per wallet, across 3 protocols, over 6 months."
- "At zkSync-level returns per wallet: $500 each × 10 wallets = $5,000 from one airdrop."
- "At Arbitrum-level: $2,000 each × 10 wallets = $20,000."
- "You're spending roughly $30–50 total in gas fees over six months to generate that activity. That's the bet."
- "This is not guaranteed. Airdrops can exclude wallets, underperform, or not happen. But the expected value math on farming three pre-token chains simultaneously is one of the best asymmetric bets in crypto right now."

---

## SECTION 3 — COSTS, PREREQUISITES & WHAT YOU NEED [9:00–14:00] (5 min)
**Format:** Talking head into screen share

### [FEEDBACK #2 — Full treatment here]

### Upfront costs list (show on screen as a clean bullet list):

**One-time setup costs:**
- 0.05–0.1 ETH to fund initial farming (~$130–$260 at time of filming)
- Railway cloud hosting: Free tier works for this. Paid plan ($5/month) if you want always-on uptime.

**Ongoing costs:**
- Gas fees: approximately $5–8/month across all 10 wallets at current L2 gas prices
- Optional: Railway paid tier if on free plan

**Total to get started seriously: ~$150–$280 one time + ~$5–8/month**

### Prerequisites (what you need installed):
1. **Node.js version 20 or higher** — the lead magnet file checks this and walks you through installing it
2. **Claude Code** (free tier works) — this is the AI terminal assistant that runs the one-shot setup
3. **Git** — almost certainly already installed on Mac/Linux; Windows users: comes with Git for Windows
4. **Railway CLI** — for cloud deployment. The setup file installs this if it's missing.
5. **A crypto exchange account** — Coinbase, Binance, Kraken, Caleb & Brown — anything where you can buy ETH and withdraw it

### [FEEDBACK #1 — Platform coverage begins here]
- "This tutorial works on Mac, Windows with WSL (Windows Subsystem for Linux), and any Linux VPS."
- Mac: everything works natively
- Windows: "Install WSL2 from the Microsoft Store — takes 5 minutes. Then run Ubuntu. Everything in this tutorial works inside that Ubuntu terminal."
- VPS: "If you want it running on a server you never have to touch, I'll show you Railway in Section 7. It's the easiest cloud option."
- Brief callout: "I'll show the Mac setup on screen, but I'll call out the Windows WSL equivalent commands wherever they differ."

---

## SECTION 4 — ARCHITECTURE OVERVIEW [14:00–18:00] (4 min)
**Format:** Screen share — code editor open + simple diagram

### What Lewis shows:
- The repo folder structure
- `src/scheduled-farm.ts` — the main runner, briefly
- `ecosystem.config.cjs` — the PM2 config showing the cron schedule (8am, 2pm, 8pm UTC)
- `src/chains/index.ts` — briefly show the 9 chains configured
- `src/safety/` — point to it: "there's a whole safety module — I'll cover that in the security section"

### Key talking points:
- "Here's how it works at a high level. We have 10 wallets stored in an encrypted file. The scheduler runs three times a day. Each run, it checks balances across all configured chains, picks 1–3 wallet/chain combinations randomly, and runs a set of tasks — wraps, swaps, contract deploys."
- "The randomness is intentional. Each wallet has a 'personality' — different active hours, different task timing, different amounts. This makes them look like real human users, not a bot."
- "The safety module checks every transaction before it executes: validates destination addresses against a whitelist, simulates the transaction, monitors balance drops, and revokes token approvals after swaps."
- "And when a run finishes, you get a Telegram message like this." (show example notification)

### Chain strategy explained:
- "We farm 9 chains total. The primary targets for airdrops right now: MegaETH, Abstract, Unichain."
- "The established chains — Base, Arbitrum, Scroll, Linea, zkSync — are included for breadth. Some may still do secondary airdrops or ecosystem token events."
- "On MegaETH, because there's no DEX yet, the system focuses on wrap/unwrap and contract deploys — which are actually the highest-signal activities for a new chain airdrop."

---

## SECTION 5 — SETTING UP CLAUDE CODE [18:00–22:00] (4 min)
**Format:** Screen share — terminal

### [FEEDBACK #1 — Platform-specific instructions here]

### What Lewis shows:
- Mac: Opening Terminal app, running `brew install node` or verifying `node --version`
- Showing Claude Code install: `npm install -g @anthropic-ai/claude-code` (or the current install method)
- Running `claude` in terminal for the first time — the authentication flow
- Windows callout: "On Windows, open PowerShell as administrator, run `wsl --install`, restart, then open Ubuntu from Start Menu. Everything from here is identical."

### Key talking points:
- "Claude Code is Anthropic's terminal AI assistant. Think of it like a developer who lives in your terminal. In a minute, we're going to paste a setup file into it and it will install and configure the entire farming system automatically."
- "You need an Anthropic account for Claude Code. Free tier is fine for this. The setup file runs in about 10–15 minutes."
- "If you already have Claude Code set up, skip ahead to Section 6."

---

## SECTION 6 — THE ONE-SHOT SETUP (LEAD MAGNET DEMO) [22:00–36:00] (14 min)
**Format:** Screen share — terminal, real-time walkthrough

### This is the core demo section. Lewis does the setup live.

### What Lewis shows (step by step):
1. Download the lead magnet file from Google Drive (show the link on screen — add to description)
2. Open Claude Code: `claude` in terminal
3. Paste the entire lead magnet markdown file into the Claude Code prompt
4. Watch Claude Code work:
   - Check Node.js and Git versions
   - Clone the repo
   - Run `npm install`
   - Generate 10 wallets — show the addresses appearing in terminal
   - Display W00 address prominently

5. **[FEEDBACK #4 — Exchange connection simplified]**
   - "Now Claude Code is going to ask you to fund W00. It doesn't matter which exchange you use."
   - "Coinbase, Binance, Kraken, Caleb & Brown — whatever you've got. Buy 0.1 ETH, go to your withdrawal page, paste the address it shows you, and send it. Network should be Ethereum mainnet."
   - Show on screen: the address displayed clearly, the simple instruction text
   - "Wait for it to confirm — usually 3–5 minutes."

6. Watch Claude Code bridge and distribute ETH across chains
7. Walk through Railway deployment (Claude Code handles the commands)
8. Telegram bot setup — show @BotFather interaction live
9. Final confirmation message arriving in Telegram

### Key talking points throughout:
- "This is the part that used to take me an hour to set up manually. The lead magnet file automates it."
- When wallet gen happens: "These 10 wallets are generated from a single mnemonic phrase — 12 words that can recover all of them. Claude Code is going to show you that phrase and tell you to back it up. Write it down. Put it somewhere safe. If you lose it, you lose access to any airdrop tokens these wallets earn."
- When bridging: "The system automatically bridges from your main wallet to each farming chain and distributes funds across all 10 wallets. You'll see the transactions happening in real time."
- "Claude Code is diagnosing and fixing any issues as it goes. If something fails — an RPC is down, a transaction times out — it handles it."

### [FEEDBACK #5 — Exchange connection]
- Dedicated callout box: "Send ETH from ANY exchange. Network: Ethereum mainnet. Amount: 0.05–0.1 ETH."
- "Don't overthink this. If you can buy and withdraw ETH, you can use this system."

---

## SECTION 7 — DEPLOYMENT OPTIONS [36:00–42:00] (6 min)
**Format:** Screen share — Railway dashboard + terminal

### [FEEDBACK #1 — All three platforms covered here]

### Sub-section A: Railway (recommended for most people) [2 min]
- Show Railway dashboard after `railway up`
- "Railway is the easiest option. Your farmer runs in the cloud. You close your laptop, it keeps going."
- Show the cron schedule in `ecosystem.config.cjs`: 8am, 2pm, 8pm UTC
- Free tier: "Railway's free plan gives you $5/month of compute credits. This farmer uses about $2–3/month. It fits."
- Show environment variables being set in Railway dashboard

### Sub-section B: PM2 on Mac (runs locally) [2 min]
- "If you want it running on your Mac: `npm install -g pm2`, then `pm2 start ecosystem.config.cjs`"
- Show `pm2 list` output
- "This works perfectly if your Mac is on most of the time. If you close the lid for a week, it pauses. Fine for casual farming."
- Mac-specific: "PM2 survives reboots if you run `pm2 startup` and `pm2 save`."

### Sub-section C: Linux VPS [1 min]
- "Cheapest always-on option: a $4/month Hetzner or DigitalOcean VPS."
- "SSH in, install Node.js, clone the repo, PM2 start — identical to Mac but runs 24/7."
- "The setup file handles this exactly the same way."

### Sub-section D: Windows WSL [1 min]
- "Inside your WSL Ubuntu terminal, PM2 works identically to Linux. Run `pm2 startup` to get it to start with Windows."
- "Railway is probably simpler on Windows — no WSL complications."

---

## SECTION 8 — SECURITY BEST PRACTICES [42:00–47:00] (5 min)
**Format:** Talking head, then screen share

### [FEEDBACK #4 — Full security chapter]

### Key talking points:
- **The mnemonic phrase:** "Your 12-word recovery phrase is the master key to all 10 wallets and every airdrop token they ever earn. Never type it into any website. Never send it to anyone, including me. Store it offline — written on paper, in a fireproof safe ideally. Not in a screenshot on your phone."

- **The ENCRYPTION_KEY environment variable:** "Your wallet private keys are stored in an encrypted file on disk. The encryption key lives in your `.env` file or in Railway's environment variables — never in the code or in Git. The setup file handles this correctly."

- **Never put mainnet funds at risk:** "The farming amounts are tiny — 0.0003 ETH per task. The safety module pre-simulates every transaction and blocks it if something looks wrong. Your main holdings should be in a separate, hardware wallet. These farming wallets hold only what's needed to farm."

- **The whitelist system:** "The address registry in the safety module validates every destination address against a whitelist before any transaction executes. If the system ever sees an unfamiliar address, it blocks the transaction and sends you a Telegram alert."

- **Keep tokens in farming wallets:** "When airdrops land, the tokens go into the farming wallets. Transfer them to your main wallet immediately — don't let them sit there."

- **This is not custodial:** "You own the wallets. Nobody else has access. The code is open source — check it at github.com/LewisWJackson/airdrop-farmer."

- **The `.env` file:** "Never commit it to Git. The repo includes `.gitignore` that excludes it. If you fork the repo, check this."

- **Revocation after swaps:** "After every DEX swap, the system automatically revokes the token approval it granted to the DEX contract. This prevents any lingering approval from being exploited."

---

## SECTION 9 — MONITORING & ONGOING MAINTENANCE [47:00–51:00] (4 min)
**Format:** Screen share — Telegram, terminal, Railway logs

### What Lewis shows:
- Telegram notification examples (session summary format: "Farming Run Complete — Tasks: 5/5 succeeded — Chains: megaeth, abstract, unichain")
- `pm2 logs airdrop-farmer --lines 50` output
- Railway logs dashboard
- `npx tsx src/check-all-balances.ts` running

### Key talking points:
- "Once it's set up, ongoing maintenance is minimal. You'll get a Telegram message after every run."
- "Check in weekly. Run the balance checker to confirm funds are being used. Occasionally top up W00 if gas reserves are low."
- "The system handles its own errors. If a transaction fails, it logs it and moves on. If something goes critically wrong — like an unexpected balance drop — it sends you a critical alert to Telegram."
- "Every few weeks, check if any of the chains you're farming have announced an airdrop snapshot date. That's your signal to make sure that chain's farming is at maximum activity."
- "The activity log tracks every transaction: `npx tsx src/index.ts` → option 5. You can see your full history per wallet, per chain."

---

## SECTION 10 — LEAD MAGNET CTA & CLOSE [51:00–55:00] (4 min)
**Format:** Talking head, camera

### CTA placement:
- "The file that does all of this automatically — I'm calling it the Jackson Airdrop Farm One-Shot Setup. Link in the description. It's free. You enter your email, I'll send you the download link."
- "It's a markdown file you paste into Claude Code. Takes 10–15 minutes. By the end you'll have 10 wallets farming three chains automatically."

### Key talking points for close:
- "The farming window for MegaETH and Abstract is open right now. These chains have confirmed funding, active ecosystems, and no tokens yet. That combination is exactly what the Arbitrum and zkSync farmers saw before those airdrops."
- "You don't need to be a developer to do this. The setup file handles everything. If you can paste text into a terminal, you can run this."
- Recap the math: "Worst case: no airdrops happen, you spent $40 in gas fees over six months. Best case: one Arbitrum-sized airdrop on Abstract nets you $20,000. That's the bet."
- "Subscribe if you want updates when I track new airdrop-eligible chains — I'm adding Monad and one more to the farmer in the next few months."
- "Leave a comment if you hit any issues in the setup. I read them."
- End card: subscribe, like, lead magnet link

---

## PRODUCTION NOTES

**B-roll needed:**
- Telegram notification screen recordings
- Terminal farming activity (sped up 4x)
- ETH price chart
- Arbitrum/zkSync airdrop announcement screenshots (for Section 2)
- Chain explorer pages showing transaction activity

**Thumbnail concept:**
- Split screen: sleeping person vs terminal with green farming activity
- Text: "10 Wallets. 3 Chains. 0 Effort." or "I Farmed $20K In Airdrops While I Slept"

**Description links (in order):**
1. Lead magnet download (Google Drive link)
2. GitHub repo: https://github.com/LewisWJackson/airdrop-farmer
3. Railway signup (referral if applicable)
4. Caleb & Brown exchange link (referral)
5. Timestamp index matching this outline

**Pinned comment:**
"Lead magnet link: [Google Drive] — paste it into Claude Code (`claude` in your terminal) and follow the prompts. Takes 10–15 min. Read the security section (42:00) before funding wallets."
