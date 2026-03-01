FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.8.2

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Generate Prisma client
RUN pnpm --filter @babloo/api db:generate

# Build shared + api
RUN pnpm --filter @babloo/shared build
RUN pnpm --filter @babloo/api build

EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter @babloo/api db:migrate:deploy && node apps/api/dist/index.js"]
