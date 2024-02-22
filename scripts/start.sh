git restore .
git pull

corepack enable pnpm
pnpm setup
pnpm add -g dotenv-cli esno
pnpm -v
pnpm run build

dotenv -c .env esno .output/server/index.mjs