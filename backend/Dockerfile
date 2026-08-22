FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm install --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run prisma:generate

FROM base AS runner
WORKDIR /app
COPY --from=builder /app ./

EXPOSE 4000
ENV PORT=4000

CMD ["sh", "-c", "npm run prisma:deploy && npm start"]
