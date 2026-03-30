/**
 * Railway deployment entry point.
 * Runs the farming loop 3x daily indefinitely.
 * Deploy with: railway up
 */
import "dotenv/config";
import { execSync } from "child_process";
import { log } from "./utils/logger.js";

const FARM_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 hours between runs
const STARTUP_DELAY_MS = 60_000; // 60s warmup after deploy

async function runFarm(): Promise<void> {
  // Run as subprocess so a crash doesn't kill the scheduler
  execSync("npx tsx src/scheduled-farm.ts --no-jitter", {
    stdio: "inherit",
    timeout: 4 * 60 * 60 * 1000, // 4hr max per run
  });
}

async function loop(): Promise<void> {
  log.info("Jackson Airdrop Farm — Railway scheduler starting");
  log.info(`First run in 60 seconds...`);
  await new Promise((r) => setTimeout(r, STARTUP_DELAY_MS));

  while (true) {
    log.info("--- Starting farming run ---");
    try {
      await runFarm();
      log.info("--- Farming run complete. Next run in 8 hours ---");
    } catch (err) {
      log.error(`Farm run failed: ${err instanceof Error ? err.message : String(err)}`);
      log.info("Will retry in 8 hours.");
    }
    await new Promise((r) => setTimeout(r, FARM_INTERVAL_MS));
  }
}

loop().catch((err) => {
  log.error(`Fatal scheduler error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
