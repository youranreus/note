git restore .
git pull

corepack enable pnpm
pnpm -v
pnpm run build

dotenv -c .env esno .output/server/index.mjs