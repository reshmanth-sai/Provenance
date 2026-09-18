# ==============================================================================
# Production Dockerfile for Provenance API Backend
# Base image: node:20-bookworm-slim (Debian base with poppler-utils and tesseract-ocr)
# ==============================================================================

FROM node:20-bookworm-slim AS base

# Install system dependencies:
# - poppler-utils: provides 'pdftoppm' for high-resolution PDF visual rasterization
# - tesseract-ocr: provides OCR extraction for non-selectable PDF/image text
# - openssl & ca-certificates: required by Prisma and secure HTTPS requests
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    tesseract-ocr \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root manifest and workspace manifests for dependency caching
COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install workspace dependencies
RUN npm ci --workspace=@provenance/api --workspace=@provenance/db --include-workspace-root

# Copy packages/db source & Prisma schema
COPY packages/db ./packages/db

# Generate Prisma Client and compile db package
RUN npm --workspace=@provenance/db run generate \
    && npm --workspace=@provenance/db run build

# Copy apps/api source and configs
COPY apps/api ./apps/api

# Compile API TypeScript to dist/
RUN npm --workspace=@provenance/api run build

# Create dedicated directory for file uploads
RUN mkdir -p /app/storage/uploads

ENV NODE_ENV=production
ENV PORT=4000
ENV STORAGE_DIR=/app/storage/uploads

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]
