import type { WalletPersonality } from "./types.js";
import { randFloat, randInt, pickRandom } from "../utils/random.js";

const ALL_L2_CHAINS = ["base", "scroll", "linea", "zksync", "arbitrum", "optimism", "megaeth", "abstract"];

/** Simple seeded PRNG (mulberry32) — deterministic per wallet */
function seededRng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function seededFloat(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Weighted chain selection — not all wallets use all chains */
function pickPreferredChains(rng: () => number): string[] {
  const count = seededInt(rng, 3, 6);
  const shuffled = [...ALL_L2_CHAINS].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

/** Generate a deterministic behavioral profile for a wallet (stable across runs) */
export function generatePersonality(walletIndex: number): WalletPersonality {
  const rng = seededRng(walletIndex * 31337 + 42);

  // Each wallet gets consistent behavioral patterns that persist across runs
  const activeHoursStart = seededInt(rng, 4, 12);
  // Ensure a wide active window (12-18 hours) so wallets aren't idle too often
  const activeHoursEnd = activeHoursStart + seededInt(rng, 12, 18);

  return {
    speedFactor: seededFloat(rng, 0.6, 2.0),
    preferredChains: pickPreferredChains(rng),
    amountJitter: seededFloat(rng, 0.08, 0.25),
    activeHoursStart,
    activeHoursEnd: activeHoursEnd > 24 ? activeHoursEnd - 24 : activeHoursEnd,
  };
}

/** Check if the current UTC hour falls within the wallet's active window */
export function shouldBeActive(personality: WalletPersonality): boolean {
  const hour = new Date().getUTCHours();

  // Handle wraparound (e.g., start=20, end=8 means active from 20:00 to 08:00)
  if (personality.activeHoursStart <= personality.activeHoursEnd) {
    return hour >= personality.activeHoursStart && hour < personality.activeHoursEnd;
  } else {
    // Wraps around midnight
    return hour >= personality.activeHoursStart || hour < personality.activeHoursEnd;
  }
}

/** Apply personality speed factor to a base delay range, returning a delay in ms */
export function getDelay(
  personality: WalletPersonality,
  baseMinMs: number,
  baseMaxMs: number
): number {
  const min = Math.round(baseMinMs * personality.speedFactor);
  const max = Math.round(baseMaxMs * personality.speedFactor);
  return randInt(min, max);
}
