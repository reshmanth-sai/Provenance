# ==============================================================================
# Production Dockerfile for Provenance Web Frontend (Next.js Standalone)
# ==============================================================================

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root manifest and workspace manifest
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Install workspace dependencies
RUN npm ci --workspace=@provenance/web --include-workspace-root

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/web ./apps/web

# Build-time environment variable for baking into client bundles
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm --workspace=@provenance/web run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public static files to both root and apps/web paths
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set correct permission for prerender cache
RUN mkdir -p ./apps/web/.next && mkdir -p ./.next && chown -R nextjs:nodejs ./apps/web/.next ./.next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
