import { spawnSync } from "node:child_process";
import { access, copyFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(rootDir, ".env");
const envExamplePath = resolve(rootDir, ".env.example");
const syncEnvScript = resolve(rootDir, "scripts/sync-env.mjs");

async function pathExists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureRootEnv() {
  if (await pathExists(envPath)) {
    return;
  }
  if (!(await pathExists(envExamplePath))) {
    throw new Error(
      `[boot] Missing ${envPath} and no ${envExamplePath} to copy. Create .env manually.`
    );
  }
  await copyFile(envExamplePath, envPath);
  console.log(
    "[boot] Created .env from .env.example — set DATABASE_URL, SSO_SECRET, and other secrets before production use."
  );
}

function runStep(label, command, args, options = {}) {
  console.log(`[boot] ${label}…`);
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
    ...options
  });
  const code = result.status ?? 1;
  if (code !== 0) {
    process.exit(code);
  }
}

async function main() {
  await ensureRootEnv();
  runStep("sync env to apps", process.execPath, [syncEnvScript]);
  runStep("generate Prisma client", "pnpm", ["--filter", "@note/api", "prisma:generate"]);
  console.log("[boot] Done. You can run `pnpm dev`.");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
