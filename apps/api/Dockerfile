# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npx prisma generate
RUN npm run build

# Prune dev dependencies in-place for the runner
RUN npm prune --production --ignore-scripts

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./

# Copy pruned node_modules and compiled output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/main"]
