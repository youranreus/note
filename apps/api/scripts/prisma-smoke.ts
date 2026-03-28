import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { prisma } from "../src/infra/prisma/client.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(currentDir, "../../.env") });
loadEnv({ path: resolve(currentDir, "../.env"), override: false });

async function run() {
  await prisma.$connect();
  const ssoId = BigInt(9_999_001);

  await prisma.user.upsert({
    where: { ssoId },
    update: {},
    create: { ssoId }
  });

  // Keep the smoke action idempotent.
  await prisma.$disconnect();
  // eslint-disable-next-line no-console
  console.log("Prisma smoke passed: users upsert succeeded.");
}

run().catch(async error => {
  // eslint-disable-next-line no-console
  console.error("Prisma smoke failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
