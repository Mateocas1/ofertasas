# ============================================
# Dockerfile for ofertasas API (Railway)
# Builds the Fastify API from the monorepo root
# ============================================

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---- Stage 1: Install dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/vtex-client/package.json ./packages/vtex-client/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --no-frozen-lockfile

# ---- Stage 2: Build ----
FROM base AS builder

# Accept DATABASE_URL at build time for prisma generate
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/vtex-client/node_modules ./packages/vtex-client/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY . .
RUN pnpm --filter @ofertasas/db run generate
RUN pnpm --filter @ofertasas/api run build

# ---- Stage 3: Production ----
FROM base AS runner
RUN apk add --no-cache chromium
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/local/lib/playwright
ENV NODE_ENV=production

WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/vtex-client/node_modules ./packages/vtex-client/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules

# Copy built output
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/vtex-client/src ./packages/vtex-client/src
COPY --from=builder /app/packages/db/src ./packages/db/src
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/vtex-client/package.json ./packages/vtex-client/
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
