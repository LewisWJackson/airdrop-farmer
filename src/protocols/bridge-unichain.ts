import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

const RELAY_API = "https://api.relay.link";
const UNICHAIN_CHAIN_ID = 130;
const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

interface RelayTxData {
  from: string;
  to: string;
  data: string;
  value: string;
  chainId: number;
  gas?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface RelayStep {
  id: string;
  kind: string;
  items: { status: string; data: RelayTxData }[];
}

interface RelayQuote {
  steps: RelayStep[];
}

/** Bridge ETH from Ethereum mainnet → Unichain via Relay */
export async function bridgeToUnichain(
  signer: ethers.Wallet,
  amount: bigint,
  to?: string,
): Promise<string> {
  const sender = await signer.getAddress();
  const recipient = to ?? sender;

  log.info(
    `Bridging ${formatEth(amount)} ETH → Unichain via Relay${to ? ` (to ${to.slice(0, 10)}...)` : ""}...`,
  );

  const quoteBody = {
    user: sender,
    recipient,
    originChainId: 1,
    destinationChainId: UNICHAIN_CHAIN_ID,
    originCurrency: ETH_ADDRESS,
    destinationCurrency: ETH_ADDRESS,
    amount: amount.toString(),
    tradeType: "EXACT_INPUT",
  };

  const quoteRes = await fetch(`${RELAY_API}/quote/v2`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quoteBody),
  });

  if (!quoteRes.ok) {
    const err = await quoteRes.text();
    throw new Error(`Relay quote failed (${quoteRes.status}): ${err}`);
  }

  const quote: RelayQuote = await quoteRes.json();

  if (!quote.steps || quote.steps.length === 0) {
    throw new Error("Relay returned no steps");
  }

  let lastTxHash = "";

  for (const step of quote.steps) {
    if (step.kind !== "transaction") continue;

    for (const item of step.items) {
      const txData = item.data;
      if (!txData || txData.chainId !== 1) {
        log.info(`Skipping step (chainId: ${txData?.chainId ?? "unknown"})`);
        continue;
      }

      log.info(
        `Sending Relay bridge tx to ${txData.to.slice(0, 12)}... value: ${formatEth(BigInt(txData.value))} ETH`,
      );

      const tx = await signer.sendTransaction({
        to: txData.to,
        value: BigInt(txData.value),
        data: txData.data,
      });

      const receipt = await tx.wait();
      lastTxHash = receipt!.hash;
      log.tx(lastTxHash, `Relay bridge ETH → Unichain`);
    }
  }

  if (!lastTxHash) {
    throw new Error("No L1 transactions executed from Relay quote");
  }

  return lastTxHash;
}
