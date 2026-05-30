# MoonLight — Premium Fashion E-Commerce Platform

Dev : https://moonlight-web-git-dev-useforwork365-1842s-projects.vercel.app/

A full-stack, production-ready e-commerce platform for premium fashion, built as a modern monorepo with Next.js 15 and NestJS.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Authentication Flow](#authentication-flow)
- [API Reference](#api-reference)
- [Admin Portal](#admin-portal)
- [Security](#security)

---

## Overview

MoonLight is a full-featured fashion e-commerce application with a customer storefront and an integrated admin portal. It supports user registration/login with JWT authentication, per-user cart and wishlist stored in PostgreSQL, product browsing with filters, order management, and a forgot/reset password flow.

The project is structured as a **pnpm monorepo** with two apps:

| App | Tech | Port |
|-----|------|------|
| `apps/web` | Next.js 15 (App Router) | 3000 |
| `apps/api` | NestJS 10 + Prisma | 4000 |

---

## Tech Stack

### Frontend (`apps/web`)

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router, `'use client'`) |
| Language | TypeScript |
| Styling | Tailwind CSS 3 |
| State | Zustand 5 |
| Data Fetching | Axios + TanStack React Query |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Auth | JWT (in-memory access token + HttpOnly refresh cookie) |

### Backend (`apps/api`)

| Category | Technology |
|----------|-----------|
| Framework | NestJS 10 |
| Language | TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Cache / Sessions | Redis (refresh token whitelist) |
| Auth | Passport.js + JWT (access + refresh tokens) |
| Validation | class-validator + class-transformer |
| Security | Helmet, CORS, bcryptjs (12 rounds), rate limiting |

### Infrastructure

| Service | Purpose |
|---------|---------|
| PostgreSQL | Primary database |
| Redis | Refresh token whitelist (token rotation) |
| Docker Compose | Local dev environment |

---

## Architecture

```
moonlight-full-stack/
├── apps/
│   ├── web/                  # Next.js 15 customer + admin frontend
│   │   ├── src/app/          # App Router pages
│   │   ├── src/components/   # Navbar, Footer, ProductCard
│   │   ├── src/lib/
│   │   │   ├── api/          # Axios API clients (auth, cart, wishlist, products)
│   │   │   └── store/        # Zustand stores (auth, cart, wishlist)
│   │   └── src/middleware.ts # Route protection (ml_session cookie)
│   │
│   └── api/                  # NestJS REST API
│       ├── src/modules/
│       │   ├── auth/         # Register, login, refresh, logout, forgot/reset password
│       │   ├── products/     # CRUD, filtering, pagination
│       │   ├── cart/         # Per-user cart (upsert, update, remove)
│       │   ├── wishlist/     # Per-user wishlist (toggle)
│       │   └── orders/       # Order placement and management
│       ├── src/common/       # Guards, interceptors, filters, decorators
│       └── prisma/           # Schema, migrations, seed
│
├── docker-compose.yml        # PostgreSQL + Redis
└── pnpm-workspace.yaml
```

### Request flow

```
Browser → Next.js Middleware (ml_session check)
       → Next.js Page (client component)
       → Axios (attaches Bearer token from memory)
       → NestJS API (JwtAuthGuard validates token)
       → Prisma → PostgreSQL
```

---

## Features

### Customer Storefront

- **Home** — Hero, category banners, bestsellers, new arrivals, newsletter
- **Collection** — Product grid with filters: price range (slider), category, sub-category, sort (newest, price, rating), search
- **Product Detail** — Image gallery, size selector, quantity, add to cart, wishlist
- **Cart** — Persistent per-user cart, quantity controls, order summary, promo code input
- **Wishlist** — Persistent per-user wishlist synced to DB, accessible across devices
- **Checkout** — Address, payment method selection
- **Orders** — Order history and status tracking
- **Auth** — Register, Login, Logout, Forgot Password, Reset Password
- **Pages** — About, Contact, Privacy Policy, Terms of Use

### Admin Portal (`/admin`)

| Page | Features |
|------|---------|
| Dashboard | Sales stats, recent orders, product count |
| Products | Paginated list, search, delete |
| Add Product | Name, description, price, category, sub-category, images, bestseller toggle, variants (size/stock) |
| Edit Product | Update any field, manage images and variants |
| Orders | View all orders, update status (pending → confirmed → shipped → delivered) |

---

## Project Structure

### Frontend pages (`apps/web/src/app/`)

```
/                     Home
/collection           Product listing with filters
/product/[slug]       Product detail
/cart                 Shopping cart (auth required)
/wishlist             Saved items (auth required)
/checkout             Place order (auth required)
/orders               Order history (auth required)
/login                Sign in
/register             Create account
/forgot-password      Request password reset
/reset-password       Set new password (via token)
/about                Brand story
/contact              Contact form
/privacy-policy       Privacy policy
/terms-of-use         Terms of use
/admin                Admin dashboard (admin role required)
/admin/products       Manage products
/admin/add            Add new product
/admin/edit/[id]      Edit product
/admin/orders         Manage orders
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for PostgreSQL + Redis)

### 1. Clone and install

```bash
git clone https://github.com/Akash-0310/Moonlight.git
cd Moonlight
pnpm install
```

### 2. Start infrastructure

```bash
docker-compose up -d
# Starts PostgreSQL on :5432 and Redis on :6379
```

### 3. Configure environment

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values

# Frontend
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local
```

### 4. Run database migration and seed

```bash
cd apps/api
npx prisma migrate dev
npm run db:seed
cd ../..
```

The seed creates:
- `admin@moonlight.com` / `Admin1234!` — admin account
- `test@moonlight.com` / `Test1234!` — test customer
- 50 products across Men, Women, Kids categories

### 5. Start development servers

```bash
# From root — starts both web (3000) and api (4000)
pnpm dev

# Or individually:
cd apps/web && npm run dev
cd apps/api && npm run dev
```

---

## Environment Variables

### `apps/api/.env`

| Variable | Description |
|----------|-------------|
| `PORT` | API server port (default: 4000) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins |
| `FRONTEND_URL` | Frontend base URL (for password reset links) |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRY` | Access token TTL (default: `15m`) |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL (default: `7d`) |

> Generate secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### `apps/web/.env.local`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:4000/api`) |

---

## Database

### Schema overview (Prisma)

```
User                  — email, name, passwordHash, role
├── Cart              — one-to-one, contains CartItems
├── Wishlist[]        — many-to-many with Product (userId + productId PK)
├── Order[]           — order history
├── Address[]         — saved delivery addresses
├── Review[]          — product reviews
└── PasswordResetToken[] — for forgot password flow

Product               — name, slug, price, category, subCategory
├── ProductImage[]    — multiple images per product
├── ProductVariant[]  — size + stock per variant
├── CartItem[]
├── OrderItem[]
├── Review[]
└── Wishlist[]

Cart                  — userId (unique), contains CartItem[]
CartItem              — cartId + variantId (unique), quantity

Order                 — userId, status, paymentMethod, total
└── OrderItem[]       — snapshot of product at time of purchase

PasswordResetToken    — userId, tokenHash (SHA-256), expiresAt (1 hour)
```

### Enums

- **Category**: `Men`, `Women`, `Kids`
- **SubCategory**: `Topwear`, `Bottomwear`, `Winterwear`
- **Size**: `XS`, `S`, `M`, `L`, `XL`, `XXL`
- **OrderStatus**: `pending` → `confirmed` → `processing` → `shipped` → `delivered` → `cancelled`
- **Role**: `customer`, `admin`

---

## Authentication Flow

### Login / Register

```
POST /api/auth/login
→ Returns: { accessToken, user }
→ Sets: refresh_token (HttpOnly cookie, 7d, path: /api/auth)
→ Frontend: stores accessToken in memory, sets ml_session cookie
```

### Silent refresh (on app load)

```
POST /api/auth/refresh  ← sends refresh_token cookie automatically
→ Returns: { accessToken }
→ Frontend: stores new accessToken, keeps ml_session alive
```

### Protected routes

```
Next.js Middleware checks ml_session cookie → redirect to /login if missing
API routes use JwtAuthGuard → validates Bearer token on every request
```

### Forgot Password

```
1. POST /api/auth/forgot-password { email }
   → generates 32-byte random token
   → stores SHA-256 hash + 1-hour expiry in DB
   → DEV: returns resetUrl in response
   → PROD: sends email with link

2. POST /api/auth/reset-password { token, password }
   → hashes token, validates expiry
   → updates passwordHash (bcrypt, 12 rounds)
   → deletes token (single-use)
```

---

## API Reference

All responses are wrapped: `{ success: true, data: ..., timestamp: "..." }`

Errors: `{ success: false, statusCode: N, message: "...", timestamp: "..." }`

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Create account |
| POST | `/login` | Public | Sign in |
| POST | `/refresh` | Cookie | Get new access token |
| POST | `/logout` | JWT | Sign out, clear cookie |
| GET | `/me` | JWT | Get current user profile |
| POST | `/forgot-password` | Public | Request reset link |
| POST | `/reset-password` | Public | Set new password |

### Products (`/api/products`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | Public | List with filters (category, subCategory, sort, search, page) |
| GET | `/products/:slug` | Public | Get product by slug |
| GET | `/products/bestsellers` | Public | Top bestsellers |
| GET | `/products/latest` | Public | Latest 8 products |
| POST | `/products` | Admin | Create product |
| PATCH | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Soft-delete product |

### Cart (`/api/cart`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cart` | JWT | Get user's cart |
| POST | `/cart/add` | JWT | Add item (productId, variantId, quantity) |
| PATCH | `/cart/update` | JWT | Update item quantity |
| DELETE | `/cart/item/:id` | JWT | Remove item |
| DELETE | `/cart` | JWT | Clear cart |

### Wishlist (`/api/wishlist`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wishlist` | JWT | Get user's wishlist |
| POST | `/wishlist/toggle/:productId` | JWT | Add if not saved, remove if saved |
| DELETE | `/wishlist/:productId` | JWT | Remove item |

### Orders (`/api/orders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | JWT | Place order |
| GET | `/orders` | JWT | Get user's orders |
| GET | `/orders/:id` | JWT | Get order detail |
| PATCH | `/orders/:id/status` | Admin | Update order status |

---

## Admin Portal

Access at `/admin` — requires an account with `role: admin`.

The seed script creates `admin@moonlight.com` / `Admin1234!` by default.

Features:
- **Dashboard** — total products, orders, revenue overview
- **Product Management** — add, edit, delete products with image uploads
- **Order Management** — view all orders, update fulfilment status

---

## Security

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcryptjs, 12 rounds |
| JWT access tokens | 15-minute expiry, in-memory only (not localStorage) |
| Refresh tokens | 7-day expiry, HttpOnly cookie, whitelisted in Redis, rotated on each use |
| Token rotation | Stolen token detection — old refresh token invalidated on use |
| Rate limiting | 100 req/min globally via `@nestjs/throttler` |
| Input validation | `class-validator` + `whitelist: true` (unknown fields stripped) |
| Security headers | Helmet (API) + custom headers in Next.js (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) |
| CORS | Strict origin allowlist, credentials enabled |
| Password reset | SHA-256 hashed tokens, 1-hour expiry, single-use |
| Email enumeration | Forgot password always returns same message |
| Admin access | Role-based guard on all admin endpoints |

---

## License

MIT
