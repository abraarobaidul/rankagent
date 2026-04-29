# RankAgent — SEO Intelligence Platform

Internal SEO dashboard for tracking domain authority, keyword rankings, backlinks, AI brand mentions, and on-page SEO health.

## Quick Start

### 1. Requirements
- Node.js 20.9+
- PostgreSQL 14+

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit DATABASE_URL, NEXTAUTH_SECRET
```

### 4. Set up database
```bash
npm run db:push    # apply schema
npm run db:seed    # seed demo data
```

### 5. Run
```bash
npm run dev
```

Open http://localhost:3000 and sign in:
- **Email:** demo@rankagent.io
- **Password:** rankagent2025

---

## Features
| Module | Description |
|--------|-------------|
| Dashboard | Overview stats, trend charts, health scores |
| Projects | Add/manage websites |
| Keywords | Track rankings, import CSV, view trends |
| Backlinks | Monitor new/lost backlinks, referring domains |
| On-Page Audit | Crawl pages for 10+ SEO issues |
| AI Mentions | Check brand visibility across ChatGPT, Claude, Gemini, Perplexity |
| Competitors | Compare DA, backlinks, keywords |
| Reports | Monthly auto-generated SEO reports |

---

## Data Mode
All data uses **mock/demo providers** by default. Pages show a `Demo Data` badge for estimated values.

Add API keys to `.env` to enable real data — see `.env.example` for all providers.

Real providers are plugged in via `lib/providers/index.ts`.

---

## Database Commands
```bash
npm run db:push       # Apply schema
npm run db:migrate    # Run migrations
npm run db:seed       # Seed demo data
npm run db:studio     # Prisma Studio
npm run db:generate   # Regenerate Prisma client
```

---

## Tech Stack
- Next.js 16 (App Router, Turbopack)
- TypeScript 5
- PostgreSQL + Prisma 7
- NextAuth v4
- Tailwind CSS v4 + Radix UI
- Recharts + Zod
