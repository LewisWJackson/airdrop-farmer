import { ethers } from "ethers";
import { log } from "../utils/logger.js";
import { formatEth } from "../utils/gas.js";

/** MegaETH L1StandardBridge on Ethereum mainnet (OP Stack) */
const MEGAETH_BRIDGE = ethers.getAddress("0x0CA3A2FBC3D770b578223FBB6b062fa875a2eE75");

const BRIDGE_ABI = [
  "function depositETH(uint32 _minGasLimit, bytes _extraData) external payable",
  "function depositETHTo(address _to, uint32 _minGasLimit, bytes _extraData) external payable",
];

/** Bridge ETH from Ethereum mainnet → MegaETH */
export async function bridgeToMegaETH(
  signer: ethers.Wallet,
  amount: bigint,
  to?: string
): Promise<string> {
  const bridge = new ethers.Contract(MEGAETH_BRIDGE, BRIDGE_ABI, signer);
  const minGasLimit = 100_000;

  log.info(`Bridging ${formatEth(amount)} ETH → MegaETH${to ? ` (to ${to.slice(0, 10)}...)` : ""}...`);

  let tx: ethers.TransactionResponse;
  if (to) {
    tx = await bridge.depositETHTo(to, minGasLimit, "0x", { value: amount });
  } else {
    tx = await bridge.depositETH(minGasLimit, "0x", { value: amount });
  }

  const receipt = await tx.wait();
  log.tx(receipt!.hash, `Bridge ETH → MegaETH`);
  return receipt!.hash;
}
