# Multi-stage Dockerfile for @sbifpt/api
# Production-ready Node.js 22 Alpine build

# ----------------- Stage 1: Builder -----------------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# Copy workspace configuration and dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/audit-trail/package.json ./packages/audit-trail/
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma/
COPY apps/api/package.json ./apps/api/

# Install dependencies (frozen lockfile)
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate Prisma client, ensure database is seeded, and compile
RUN pnpm --filter @sbifpt/db generate
RUN pnpm --filter @sbifpt/db push --accept-data-loss
RUN pnpm --filter @sbifpt/db seed
RUN pnpm --filter @sbifpt/api build

# ----------------- Stage 2: Runner -----------------
FROM node:22-alpine AS runner
RUN apk add --no-cache curl libc6-compat openssl dumb-init
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4100
ENV DATABASE_URL="file:/app/packages/db/prisma/dev.db"
# Lean memory optimization for Contabo VPS (~128MB-256MB heap limit)
ENV NODE_OPTIONS="--max-old-space-size=256"

# Create unprivileged system user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodejs

# Copy runtime assets with correct ownership
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/apps/api ./apps/api
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 4100

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4100/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "node_modules/tsx/dist/cli.mjs", "apps/api/src/index.ts"]
