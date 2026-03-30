# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

# Install security updates
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY common/package.json ./common/
COPY apps/auth-service/package.json ./apps/auth-service/

RUN npm ci --omit=dev

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY common/package.json ./common/
COPY apps/auth-service/package.json ./apps/auth-service/

RUN npm ci

COPY common/ ./common/
COPY apps/auth-service/ ./apps/auth-service/

# ─── Stage 3: production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk update && apk upgrade --no-cache \
    && addgroup -S appgroup \
    && adduser  -S appuser -G appgroup

WORKDIR /app

# Copy only production node_modules and source
COPY --from=deps  /app/node_modules          ./node_modules/
COPY --from=deps  /app/common/node_modules   ./common/node_modules/
COPY --from=build /app/common                ./common/
COPY --from=build /app/apps/auth-service     ./apps/auth-service/

# Drop to non-root user
USER appuser

WORKDIR /app/apps/auth-service

ENV NODE_ENV=production \
    SERVICE_NAME=auth-service \
    API_PORT=3000

EXPOSE 3000

# Healthcheck — lets container runtimes know when the service is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "index.js"]
