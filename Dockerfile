FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

FROM base AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
COPY backend/prisma ./prisma/
RUN npm install --legacy-peer-deps --ignore-scripts

FROM base AS builder
WORKDIR /app
COPY backend ./
COPY --from=deps /app/node_modules ./node_modules
RUN npx prisma generate --schema ./prisma/schema.prisma

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app ./

EXPOSE 4000

CMD ["npm", "start"]

