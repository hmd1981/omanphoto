FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/omanphoto

FROM base AS deps
# Prisma reads DATABASE_URL from the schema datasource even for `generate` (no DB connection).
ARG DATABASE_URL_BUILD=postgresql://omanphoto:omanphoto_dev@127.0.0.1:5432/omanphoto?schema=public
ENV DATABASE_URL=$DATABASE_URL_BUILD
COPY package.json ./
COPY app/package.json app/package-lock.json ./app/
COPY server/prisma ./server/prisma
COPY scripts ./scripts
WORKDIR /opt/omanphoto/app
RUN npm ci
WORKDIR /opt/omanphoto
RUN chmod a+x scripts/check-env.sh scripts/prisma-safe.sh scripts/lib/omanphoto-env.sh \
  && bash scripts/prisma-safe.sh generate --schema=../server/prisma/schema.prisma

FROM base AS builder
# Set only via `docker compose build --build-arg ...` (see docker/build-web.sh). Not read from compose .env.
ARG NEXT_PUBLIC_BUILD_ID
ARG NEXT_PUBLIC_BUILD_TIME
ENV NEXT_PUBLIC_BUILD_ID=$NEXT_PUBLIC_BUILD_ID
ENV NEXT_PUBLIC_BUILD_TIME=$NEXT_PUBLIC_BUILD_TIME
ARG DATABASE_URL_BUILD=postgresql://omanphoto:omanphoto_dev@127.0.0.1:5432/omanphoto?schema=public
ENV DATABASE_URL=$DATABASE_URL_BUILD
COPY --from=deps /opt/omanphoto/app/node_modules ./app/node_modules
COPY app ./app
COPY server/prisma ./server/prisma
COPY scripts ./scripts
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /opt/omanphoto/app
RUN set -eux; \
  printf '%s\n' \
    "=== Oman Photo / Next.js build stamps ===" \
    "NEXT_PUBLIC_BUILD_ID=${NEXT_PUBLIC_BUILD_ID}" \
    "NEXT_PUBLIC_BUILD_TIME=${NEXT_PUBLIC_BUILD_TIME}"; \
  test -n "${NEXT_PUBLIC_BUILD_ID}"; \
  test "${NEXT_PUBLIC_BUILD_ID}" != "unknown"; \
  test -n "${NEXT_PUBLIC_BUILD_TIME}"; \
  test "${NEXT_PUBLIC_BUILD_TIME}" != "unknown"
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /opt/omanphoto/app/node_modules ./app/node_modules
COPY app/package.json app/package-lock.json ./app/
COPY --from=builder /opt/omanphoto/app/.next ./app/.next
COPY --from=builder /opt/omanphoto/app/public ./app/public
COPY app ./app
COPY server/prisma ./server/prisma
COPY scripts ./scripts
RUN mkdir -p /opt/omanphoto/uploads \
  && mkdir -p /opt/omanphoto/app/.next/cache/images \
  && chmod a+x /opt/omanphoto/scripts/check-env.sh /opt/omanphoto/scripts/prisma-safe.sh /opt/omanphoto/scripts/lib/omanphoto-env.sh \
  && chown -R node:node /opt/omanphoto/uploads /opt/omanphoto/scripts /opt/omanphoto/app/.next/cache
USER node
WORKDIR /opt/omanphoto/app
EXPOSE 3000
# DATABASE_URL comes from docker-compose (host `db` in the stack). check-env + prisma-safe fail fast if missing or DB down.
# Empty DB: restore prisma/cms-baseline.json (never demo seed). Existing DB: no CMS changes on boot.
CMD ["bash", "-c", "/opt/omanphoto/scripts/prisma-safe.sh migrate deploy --schema=../server/prisma/schema.prisma && (npx tsx scripts/patch-legacy-nav-labels.ts || true) && (npx tsx scripts/seed-if-empty.ts && OMANPHOTO_PRESERVE_CMS=1 OMANPHOTO_SEED_DEMO=0 npx tsx scripts/bootstrap-empty-db.ts || true) && exec npm run start"]
