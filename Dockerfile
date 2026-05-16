FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Separate toolchain for `prisma migrate deploy` at startup
# (full node_modules to include all transitive deps like `effect`)
RUN mkdir -p /migrate && chown nextjs:nodejs /migrate
COPY --from=builder --chown=nextjs:nodejs /app/prisma /migrate/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts /migrate/prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/package.json /migrate/package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules /migrate/node_modules

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "(cd /migrate && node ./node_modules/prisma/build/index.js migrate deploy) && node server.js"]
