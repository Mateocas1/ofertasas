# Multi-stage build: build stage
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Production stage
FROM node:22-alpine
RUN apk add --no-cache chromium chromium-chromedriver
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/local/lib/playwright
RUN mkdir -p /usr/local/lib/playwright

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/turbo.json ./turbo.json
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages

# Install Playwright dependencies
RUN npm install -g pnpm
RUN pnpm install --filter @ofertasas/api --prod

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start command
CMD ["node", "apps/api/dist/index.js"]