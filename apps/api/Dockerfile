# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install --ignore-scripts --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts --legacy-peer-deps

# Copy Prisma-generated client and engine binaries from builder.
# Ensures the linux-musl-openssl-3.0.x binary is used on Alpine 3.17+.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 4000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma@5 migrate deploy && node --max-old-space-size=256 dist/main"]
