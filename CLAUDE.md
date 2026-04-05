# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev           # start Next.js dev server on :3000

# Build & lint
pnpm build         # production build
pnpm lint          # ESLint

# Full stack with Docker (includes Postgres + MinIO)
docker-compose up --build

# Database — apply schema manually once the DB container is running
psql $DATABASE_URL -f schema.sql
```

## Architecture

This is a **Next.js 16 App Router** B2B e-commerce/quoting system (sedería / fabric store) targeting Panama. The app supports three user roles: `minorista`, `mayorista`, and `admin`.

### Key Layers

| Layer | Location | Notes |
|-------|----------|-------|
| DB types & shared interfaces | `lib/products.ts`, `lib/quotes.ts`, `lib/auth.ts` | Plain TypeScript — no ORM |
| DB access | `lib/db.ts` | Raw `pg` pool; parameterized queries only |
| Server Actions | `app/actions/` | `'use server'` files for products, quotes, file upload |
| Route segments | `app/` | Standard App Router structure |
| UI components | `components/{auth,catalog,home,layout,messages,quotes,theme-provider,ui}/` | shadcn/ui base + custom |

### Auth

`lib/auth.ts` currently uses **mock localStorage-based auth** (no real session/JWT). The schema and comments indicate the intended backend is **Supabase** (PostgreSQL via `pg` pool + `DATABASE_URL` env).

### Storage

Product images upload to **AWS S3 / MinIO** via `@aws-sdk`. In Docker Compose, MinIO runs on `:9000` (API) and `:9001` (console). The env var `NEXT_PUBLIC_STORAGE_URL` exposes the public bucket URL to the browser.

### Database

PostgreSQL schema is in `schema.sql`. Key tables: `users`, `user_documents`, `categories`, `products`, `product_images`, `product_variants`, `quotes`, `quote_items`. Enum types: `user_role`, `user_status`, `quote_status`, `document_type`, `document_status`.

### Environment Variables

```env
DATABASE_URL=postgresql://...
S3_ENDPOINT=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET_NAME=
S3_FORCE_PATH_STYLE=true
NEXT_PUBLIC_STORAGE_URL=
```

### Hero Slider

Slide content is **hardcoded** in `components/home/hero-slider.tsx` (`slides` array). To add/remove slides or change images, edit that file directly.
