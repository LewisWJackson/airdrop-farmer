import "dotenv/config";
import { ethers } from "ethers";
import { loadWallets, getPrivateKey } from "./wallet-manager.js";
import { getSigner, getProvider } from "./chains/index.js";
import { bridgeToAbstract } from "./protocols/bridge-abstract.js";
import { formatEth } from "./utils/gas.js";
import { log } from "./utils/logger.js";

const BRIDGE_AMOUNT = ethers.parseEther("0.02");
const W00_RESERVE = ethers.parseEther("0.001");
const SKIP_THRESHOLD = ethers.parseEther("0.0003");

async function waitForArrival(address: string, maxWaitMs = 600_000): Promise<boolean> {
  const provider = getProvider("abstract");
  const startBalance = await provider.getBalance(address);
  const deadline = Date.now() + maxWaitMs;

  log.info(`Waiting for bridge on Abstract (current: ${formatEth(startBalance)} ETH)...`);

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 15_000)); // Relay is fast — check every 15s
    const balance = await provider.getBalance(address);
    if (balance > startBalance) {
      log.success(`Bridge arrived on Abstract! Balance: ${formatEth(balance)} ETH`);
      return true;
    }
    log.info(`Still waiting... (${Math.round((deadline - Date.now()) / 1000)}s left)`);
  }

  log.warn(`Bridge didn't arrive within ${maxWaitMs / 1000}s`);
  return false;
}

async function main(): Promise<void> {
  const wallets = loadWallets();
  const w00 = wallets[0];
  if (!w00) { log.error("No wallets."); return; }

  const privateKey = getPrivateKey(w00);
  const ethSigner = getSigner("ethereum", privateKey);
  const address = await ethSigner.getAddress();

  // Check if already funded
  try {
    const absProvider = getProvider("abstract");
    const absBal = await absProvider.getBalance(address);
    if (absBal > ethers.parseEther("0.005")) {
      log.info(`Abstract already funded (${formatEth(absBal)} ETH) — skipping to distribution`);
      await distribute(wallets);
      return;
    }
  } catch { /* continue */ }

  // Check mainnet balance
  const ethBalance = await getProvider("ethereum").getBalance(address);
  log.info(`W00 Ethereum balance: ${formatEth(ethBalance)} ETH`);

  if (ethBalance < BRIDGE_AMOUNT + ethers.parseEther("0.005")) {
    log.error(`Not enough ETH on mainnet`);
    return;
  }

  // Bridge
  log.divider();
  log.info("Bridging ETH → Abstract via Relay...");
  try {
    const txHash = await bridgeToAbstract(ethSigner, BRIDGE_AMOUNT);
    const arrived = await waitForArrival(address);

    if (arrived) {
      await distribute(wallets);
    } else {
      log.warn("Bridge didn't arrive yet. Run this script again in a few minutes to distribute.");
    }
  } catch (err: unknown) {
    log.error(`Bridge failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function distribute(wallets: ReturnType<typeof loadWallets>): Promise<void> {
  const w00 = wallets[0];
  const recipients = wallets.slice(1);
  const w00Key = getPrivateKey(w00);

  const provider = getProvider("abstract");
  const balance = await provider.getBalance(w00.address);

  log.divider();
  log.info(`W00 Abstract balance: ${formatEth(balance)} ETH`);

  if (balance < ethers.parseEther("0.003")) {
    log.warn("Balance too low to distribute");
    return;
  }

  const needsFunding: typeof recipients = [];
  for (const r of recipients) {
    const rBal = await provider.getBalance(r.address);
    if (rBal > SKIP_THRESHOLD) {
      log.info(`  W${String(r.index).padStart(2, "0")} already has ${formatEth(rBal)} ETH`);
    } else {
      needsFunding.push(r);
    }
  }

  if (needsFunding.length === 0) {
    log.info("All wallets already funded on Abstract");
    return;
  }

  const available = balance - W00_RESERVE;
  const perWallet = available / BigInt(needsFunding.length);

  log.info(`Distributing ${formatEth(available)} ETH → ${formatEth(perWallet)} each (${needsFunding.length} wallets)`);

  const signer = getSigner("abstract", w00Key);

  for (const recipient of needsFunding) {
    const label = `W00 → W${String(recipient.index).padStart(2, "0")}`;
    try {
      const tx = await signer.sendTransaction({ to: recipient.address, value: perWallet });
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        log.tx(tx.hash, `${label}: ${formatEth(perWallet)} ETH on Abstract`);
      } else {
        log.error(`${label}: reverted`);
      }
    } catch (err: unknown) {
      log.error(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  log.divider();
  log.success("Abstract distribution complete!");
}

main().catch((err) => {
  log.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
