# docker login --username $CR_USERNAME --password-stdin $CR_HOST
# docker build -t $CR_HOST/$CR_NS/$CR_IMAGENAME:${{ github.event.inputs.tag_ci }} \
#  --target $DOCKERFILE_TARGET \
#  --build-arg ARG_NODE_ENV=${{ github.event.inputs.cr_env }} \
#  --build-arg ARG_API_PORT=3000 \
#  $DOCKERFILE_PATH || exit 1001
# ARG <name>[=<default value>]
# E.G.
# ARG SETTINGS
# RUN ./run/init-stuff $SETTINGS

# Set Node Version - version 22 can remove esm shim... if no top level await
ARG NODE_VERSION=22
ARG API_PORT=3000
ARG APP_NAME=app-sample

# ENV NODE_ENV $ARG_NODE_ENV
# ENV PORT $ARG_API_PORT
# ENV API_PORT $ARG_API_PORT


# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps
ARG APP_NAME

# Install security updates
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY common/package.json ./common/
COPY apps/${APP_NAME}/package.json ./apps/${APP_NAME}/

RUN npm ci --omit=dev

# ─── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS build
ARG APP_NAME

WORKDIR /app

COPY package.json package-lock.json ./
COPY common/package.json ./common/
COPY apps/${APP_NAME}/package.json ./apps/${APP_NAME}/

RUN npm ci

COPY common/ ./common/
COPY apps/${APP_NAME}/ ./apps/${APP_NAME}/

# ─── Stage 3: production image ────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS production
ARG APP_NAME
ARG API_PORT

RUN apk update && apk upgrade --no-cache \
    && addgroup -S appgroup \
    && adduser  -S appuser -G appgroup

WORKDIR /app

# Copy only production node_modules and source
COPY --from=deps  /app/node_modules          ./node_modules/
COPY --from=deps  /app/common/node_modules   ./common/node_modules/
COPY --from=build /app/common                ./common/
COPY --from=build /app/apps/${APP_NAME}     ./apps/${APP_NAME}/

WORKDIR /app/apps/${APP_NAME}

# Drop to non-root user
USER appuser

ENV NODE_ENV=production \
    SERVICE_NAME=${APP_NAME} \
    API_PORT=${API_PORT}

EXPOSE ${API_PORT}

# Healthcheck — lets container runtimes know when the service is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${API_PORT}/health || exit 1

CMD ["node", "index.js"]
