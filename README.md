# QuickServe POS

![CI](https://github.com/WahajRashid1020/POS-System/actions/workflows/ci.yml/badge.svg)

A point-of-sale app for quick-service restaurants (a chipper-style menu), built as a full-stack Next.js project. Cashiers take orders and card payments, the kitchen sees them live, and managers get sales reports and an AI assistant that answers questions about their numbers.

It is a portfolio project, built with a focus on how to ship it safely: server-side pricing, role-based access on every API route, a tested payment flow, and a CI pipeline with security scanning. See [SECURITY.md](SECURITY.md) for how it is protected.

## Features

- **POS terminal**: menu grid by category, instant item search, cart, dine-in / takeaway / delivery
- **Payments**: cash, or card through Stripe Elements (test mode). Card data never touches this server
- **Kitchen display**: active orders refresh every 5 seconds, with status updates (pending, preparing, ready, completed)
- **Recent orders**: view and update orders from the POS screen
- **Sales reports**: revenue, orders by hour and type, top items and categories (Recharts)
- **AI manager chat**: ask questions about sales in plain English (Google Gemini, answers grounded in real order data)
- **Roles**: admin, manager, cashier and kitchen, enforced on the server

## Tech stack

| Area | Tools |
|---|---|
| Frontend | Next.js 16 (App Router), React 18, TypeScript (strict), Tailwind CSS, Recharts |
| Backend | Next.js API routes (serverless), MongoDB with Mongoose |
| Auth | NextAuth.js (Google OAuth, JWT sessions) |
| Payments | Stripe PaymentIntents and webhooks |
| AI | Google Gemini API |
| Validation | zod |
| Testing | Vitest (203 unit and route tests) |
| CI/CD | GitHub Actions (tests, type-check, `npm audit`, build), CodeQL, Dependabot, Vercel |

## Getting started

```bash
npm install --legacy-peer-deps

cp .env.example .env.local
# Fill in MongoDB, NextAuth, Google OAuth, Gemini and Stripe test keys

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run dev` runs the test suite first and only starts the server if it passes.

### Demo accounts (local development)

The passwordless demo accounts are **off by default**, because anyone who can reach the login could pick any role. To use them locally, add this to `.env.local` and restart:

```
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true
```

Never enable this on a deployment that uses real data or live Stripe keys.

### Stripe test mode

Use Stripe's test keys (`sk_test_...`, `pk_test_...`). In the card form, enter `4242 4242 4242 4242` with any future expiry and any CVC. No real money moves in test mode.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run tests, then start the dev server |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Re-run tests as you edit |
| `npm run build` | Production build |

## Project structure

```
src/
├── app/
│   ├── login, pos, kitchen, reports, chat   # screens
│   └── api/                                 # backend routes
│       ├── orders, orders/[id]              # list, create, update status
│       ├── payments/create-intent, webhook  # Stripe
│       ├── reports, menu, ai/chat
│       └── auth/[...nextauth]
├── components/                              # pos, kitchen, reports, chat, shared UI
└── lib/
    ├── api/            # typed client-side data layer (one place for all fetch calls)
    ├── catalog.ts      # server-side menu pricing (never trust client prices)
    ├── pricing.ts      # order totals and currency-to-cents
    ├── validation.ts   # zod schemas
    ├── api-auth.ts     # server-side role checks
    ├── rate-limit.ts, csrf.ts, security-log.ts
    └── models/         # Mongoose models
```

Tests live next to the code they cover (`*.test.ts`).

## Security highlights

- Order prices come from the server-side menu, never from the browser, and one Stripe payment can pay for only one order
- Every data route checks the user's role on the server, validates input with zod, and rejects unexpected fields
- Rate limiting, same-site checks on state-changing requests, and CSP / HSTS security headers
- Stripe webhook signatures are verified; AI replies are rendered as plain text, not HTML
- CI runs tests, type-check, `npm audit` and CodeQL on every push and pull request

Details, the secrets rotation plan and a pre-launch checklist are in [SECURITY.md](SECURITY.md).

## Known limitations

- The rate limiter is in-memory, so it is per serverless instance (a shared store would make it global)
- The CSP still allows inline scripts, which Next.js needs unless nonces are added
- No end-to-end browser tests yet, and `npm run lint` is not set up for Next.js 16
- Menu items are defined in `src/lib/seed-data.ts`; the menu-management API exists but there is no admin screen for it

## Author

**Wahaj Rashid** — [Portfolio](https://wahajrashid.com) | [LinkedIn](https://linkedin.com/in/wahajrashid) | [GitHub](https://github.com/WahajRashid1020)
