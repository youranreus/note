import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceEnvPath = resolve(rootDir, ".env");
const targetEnvPaths = [
  resolve(rootDir, "apps/web/.env"),
  resolve(rootDir, "apps/api/.env")
];

async function readSourceEnv() {
  try {
    return await readFile(sourceEnvPath, "utf-8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(`[sync-env] Missing source file: ${sourceEnvPath}`);
    }
    throw error;
  }
}

async function syncOneFile(targetPath, sourceContent) {
  await mkdir(dirname(targetPath), { recursive: true });

  let currentContent = "";
  try {
    currentContent = await readFile(targetPath, "utf-8");
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  if (currentContent === sourceContent) {
    console.log(`[sync-env] unchanged: ${targetPath}`);
    return;
  }

  await writeFile(targetPath, sourceContent, "utf-8");
  console.log(`[sync-env] updated: ${targetPath}`);
}

async function main() {
  const sourceContent = await readSourceEnv();
  await Promise.all(targetEnvPaths.map(target => syncOneFile(target, sourceContent)));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
