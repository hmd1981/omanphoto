FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/omanphoto

FROM base AS deps
COPY package.json ./
COPY app/package.json app/package-lock.json ./app/
COPY server/prisma ./server/prisma
WORKDIR /opt/omanphoto/app
RUN npm ci
WORKDIR /opt/omanphoto
RUN npx prisma generate --schema=server/prisma/schema.prisma

FROM base AS builder
ARG NEXT_PUBLIC_BUILD_ID=unknown
ARG NEXT_PUBLIC_BUILD_TIME=unknown
ENV NEXT_PUBLIC_BUILD_ID=$NEXT_PUBLIC_BUILD_ID
ENV NEXT_PUBLIC_BUILD_TIME=$NEXT_PUBLIC_BUILD_TIME
COPY --from=deps /opt/omanphoto/app/node_modules ./app/node_modules
COPY app ./app
COPY server/prisma ./server/prisma
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /opt/omanphoto/app
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
RUN mkdir -p /opt/omanphoto/uploads && chown -R node:node /opt/omanphoto/uploads
USER node
WORKDIR /opt/omanphoto/app
EXPOSE 3000
# On first boot (empty DB), run seed so admin login works. seed-if-empty exits 1 if users already exist.
CMD ["sh", "-c", "npx prisma migrate deploy --schema=../server/prisma/schema.prisma && npx tsx scripts/patch-legacy-nav-labels.ts || true && (npx tsx scripts/seed-if-empty.ts && npx prisma db seed || true) && exec npm run start"]
