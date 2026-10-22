# Multi-stage Dockerfile for @sbifpt/web
# Stage 1: Build static assets using Vite
FROM node:26.12.1-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.32.1

# Copy workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source trees
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

# Build static SPA bundle
RUN pnpm --filter @sbifpt/web build

# Stage 2: Serve static files with Nginx Alpine (~15-30MB RAM footprint)
FROM nginx:alpine AS runner

# Copy custom Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets into Nginx web root
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3100/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
