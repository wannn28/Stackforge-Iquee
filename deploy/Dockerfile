# syntax=docker/dockerfile:1

# Placeholder image. package.json is not in this repo yet, and frontend owns
# the Next.js app (app/, components/, and the lib/ Supabase client).
#
# This file only exists so deploy/docker-compose.yml has a buildable app
# service that listens on port 3000. When frontend adds the Next.js app,
# replace the instructions below with a standalone multi-stage build:
#
#   FROM node:22-alpine AS deps
#   WORKDIR /app
#   COPY package.json package-lock.json ./
#   RUN npm ci
#
#   FROM node:22-alpine AS builder
#   WORKDIR /app
#   COPY --from=deps /app/node_modules ./node_modules
#   COPY . .
#   ENV NEXT_TELEMETRY_DISABLED=1
#   # NEXT_PUBLIC_* values are inlined at build time. Pass them as build args.
#   RUN npm run build
#
#   FROM node:22-alpine AS runner
#   WORKDIR /app
#   ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
#   RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
#   COPY --from=builder /app/public ./public
#   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
#   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
#   USER nextjs
#   EXPOSE 3000
#   CMD ["node", "server.js"]
#
# That build requires output: "standalone" in next.config. Do not copy .env
# into the image; inject runtime secrets via the compose env_file.

FROM node:22-alpine

LABEL org.opencontainers.image.title="stackforge-iquee" \
      org.opencontainers.image.description="Placeholder until the Next.js standalone build lands."

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY deploy/placeholder-server.js /app/server.js

USER node

EXPOSE 3000

CMD ["node", "server.js"]
