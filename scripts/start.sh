git restore .
git pull

corepack enable pnpm
pnpm add -g dotenv-cli esno
pnpm -v
pnpm run build

dotenv -c esno .output/server/index.mjs