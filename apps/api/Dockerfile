# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Install build tools needed for native modules
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install --ignore-scripts --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --production --ignore-scripts

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/main"]
