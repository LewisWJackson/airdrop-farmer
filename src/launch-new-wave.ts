import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { getSigner, getProvider } from "./chains/index.js";
import { bridgeToMegaETH } from "./protocols/bridge-megaeth.js";
import { bridgeToAbstract } from "./protocols/bridge-abstract.js";
import { formatEth } from "./utils/gas.js";
import { log } from "./utils/logger.js";
import { logTaskCost } from "./cost-logger.js";

/** How much ETH to bridge to each new chain */
const BRIDGE_AMOUNT_MEGAETH = ethers.parseEther("0.02");
const BRIDGE_AMOUNT_ABSTRACT = ethers.parseEther("0.02");

/** Reserve for W00 on each L2 after distributing */
const W00_RESERVE = ethers.parseEther("0.001");

/** Skip distribution if recipient already has this much */
const SKIP_THRESHOLD = ethers.parseEther("0.0003");

/** Max wait for bridge arrival (15 min) */
const MAX_BRIDGE_WAIT_MS = 15 * 60 * 1000;

async function waitForBridgeArrival(
  chain: string,
  address: string,
  maxWaitMs: number = MAX_BRIDGE_WAIT_MS
): Promise<boolean> {
  const provider = getProvider(chain);
  const startBalance = await provider.getBalance(address);
  const deadline = Date.now() + maxWaitMs;

  log.info(`Waiting for bridge on ${chain} (current: ${formatEth(startBalance)} ETH)...`);

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 30_000));
    const balance = await provider.getBalance(address);
    if (balance > startBalance) {
      log.success(`Bridge arrived on ${chain}! Balance: ${formatEth(balance)} ETH`);
      return true;
    }
    const secsLeft = Math.round((deadline - Date.now()) / 1000);
    log.info(`Still waiting on ${chain}... (${secsLeft}s left)`);
  }

  log.warn(`Bridge to ${chain} didn't arrive within ${maxWaitMs / 1000}s`);
  return false;
}

async function distributeOnChain(chain: string): Promise<void> {
  const wallets = loadWallets();
  const w00 = wallets[0];
  const recipients = wallets.slice(1);
  const w00Key = getPrivateKey(w00);

  const provider = getProvider(chain);
  const balance = await provider.getBalance(w00.address);

  if (balance < ethers.parseEther("0.003")) {
    log.warn(`${chain}: W00 balance too low (${formatEth(balance)} ETH), skipping distribution`);
    return;
  }

  // Check which recipients need funding
  const needsFunding: typeof recipients = [];
  for (const r of recipients) {
    try {
      const rBal = await provider.getBalance(r.address);
      if (rBal > SKIP_THRESHOLD) {
        log.info(`  W${String(r.index).padStart(2, "0")} already has ${formatEth(rBal)} ETH on ${chain}`);
      } else {
        needsFunding.push(r);
      }
    } catch {
      needsFunding.push(r);
    }
  }

  if (needsFunding.length === 0) {
    log.info(`All wallets already funded on ${chain}`);
    return;
  }

  const available = balance - W00_RESERVE;
  const perWallet = available / BigInt(needsFunding.length);

  log.info(`${chain}: distributing ${formatEth(available)} ETH → ${formatEth(perWallet)} each (${needsFunding.length} wallets)`);

  const signer = getSigner(chain, w00Key);

  for (const recipient of needsFunding) {
    const label = `W00 → W${String(recipient.index).padStart(2, "0")}`;
    try {
      const tx = await signer.sendTransaction({
        to: recipient.address,
        value: perWallet,
      });
      const receipt = await tx.wait();
      if (receipt && receipt.status === 1) {
        log.tx(tx.hash, `${label}: ${formatEth(perWallet)} ETH on ${chain}`);
      } else {
        log.error(`${label}: tx reverted on ${chain}`);
      }
    } catch (err: unknown) {
      log.error(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

async function main(): Promise<void> {
  const wallets = loadWallets();
  const w00 = wallets[0];
  if (!w00) {
    log.error("No wallets found.");
    return;
  }

  const privateKey = getPrivateKey(w00);
  const ethSigner = getSigner("ethereum", privateKey);
  const address = await ethSigner.getAddress();

  // Check mainnet balance
  const ethProvider = getProvider("ethereum");
  const ethBalance = await ethProvider.getBalance(address);
  log.info(`W00 (${address.slice(0, 10)}...) Ethereum balance: ${formatEth(ethBalance)} ETH`);

  const totalNeeded = BRIDGE_AMOUNT_MEGAETH + BRIDGE_AMOUNT_ABSTRACT + ethers.parseEther("0.01"); // gas buffer
  if (ethBalance < totalNeeded) {
    log.error(`Need ~${formatEth(totalNeeded)} ETH on mainnet, only have ${formatEth(ethBalance)} ETH`);
    return;
  }

  log.divider();
  log.info("=== PHASE 1: Bridge ETH to new chains ===");
  log.divider();

  // ---- MegaETH Bridge ----
  let megaethFunded = false;
  try {
    const megaProvider = getProvider("megaeth");
    const megaBal = await megaProvider.getBalance(address);
    if (megaBal > ethers.parseEther("0.005")) {
      log.info(`MegaETH already funded (${formatEth(megaBal)} ETH) — skipping bridge`);
      megaethFunded = true;
    }
  } catch { /* can't check — bridge anyway */ }

  if (!megaethFunded) {
    try {
      const txHash = await bridgeToMegaETH(ethSigner, BRIDGE_AMOUNT_MEGAETH);
      logTaskCost("ethereum", txHash, "bridge", "wallet-0", "Bridge ETH → MegaETH").catch(() => {});
      megaethFunded = await waitForBridgeArrival("megaeth", address);
    } catch (err: unknown) {
      log.error(`MegaETH bridge failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ---- Abstract Bridge ----
  let abstractFunded = false;
  try {
    const absProvider = getProvider("abstract");
    const absBal = await absProvider.getBalance(address);
    if (absBal > ethers.parseEther("0.005")) {
      log.info(`Abstract already funded (${formatEth(absBal)} ETH) — skipping bridge`);
      abstractFunded = true;
    }
  } catch { /* can't check — bridge anyway */ }

  if (!abstractFunded) {
    try {
      const txHash = await bridgeToAbstract(ethSigner, BRIDGE_AMOUNT_ABSTRACT);
      logTaskCost("ethereum", txHash, "bridge", "wallet-0", "Bridge ETH → Abstract").catch(() => {});
      abstractFunded = await waitForBridgeArrival("abstract", address);
    } catch (err: unknown) {
      log.error(`Abstract bridge failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ---- Phase 2: Distribute on new chains ----
  log.divider();
  log.info("=== PHASE 2: Distribute ETH to fleet ===");
  log.divider();

  if (megaethFunded) {
    await distributeOnChain("megaeth");
  }

  if (abstractFunded) {
    await distributeOnChain("abstract");
  }

  // ---- Phase 3: Final balance check ----
  log.divider();
  log.info("=== FINAL BALANCES ===");
  log.divider();

  const chains = ["ethereum", "megaeth", "abstract"];
  for (const wallet of wallets) {
    const parts: string[] = [];
    for (const chain of chains) {
      try {
        const provider = getProvider(chain);
        const balance = await provider.getBalance(wallet.address);
        if (balance > 0n) {
          parts.push(`${chain}: ${formatEth(balance)}`);
        }
      } catch {
        // skip
      }
    }
    const balStr = parts.length > 0 ? parts.join(" | ") : "empty";
    log.info(`W${String(wallet.index).padStart(2, "0")} [${balStr}]`);
  }

  log.divider();
  log.success("New wave launch complete! Run 'npm run schedule' to start farming.");
}

main().catch((err) => {
  log.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
