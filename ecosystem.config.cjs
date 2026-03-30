// ⚠️  Update the `cwd` path to match your local installation directory
const PROJECT_DIR = process.env.PROJECT_DIR || process.cwd();

module.exports = {
  apps: [
    {
      name: "jackson-airdrop-farm",
      script: "npx",
      args: "tsx src/scheduled-farm.ts",
      cwd: PROJECT_DIR,
      cron_restart: "0 8,14,20 * * *", // 8am, 2pm, 8pm UTC
      watch: false,
      autorestart: false, // one-shot per run, don't restart on exit
      env: {
        NODE_ENV: "production",
      },
      log_file: "logs/combined.log",
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
