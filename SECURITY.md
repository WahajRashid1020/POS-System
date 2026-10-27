# Security

## Reporting a vulnerability

Please report security issues privately through GitHub's
**Security → Report a vulnerability** form on this repository rather than a
public issue. Include steps to reproduce and the affected route or file.

## How the app is protected

- **Auth:** NextAuth (JWT sessions, 12-hour expiry). Every API route checks the
  role on the server (`src/lib/api-auth.ts`); the client-side route guard only
  hides screens. The passwordless demo accounts are **off unless
  `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`**: only enable them locally or on a
  throwaway deployment with a test database and Stripe test keys.
- **Input:** request bodies are validated and whitelisted with zod
  (`src/lib/validation.ts`, `src/lib/catalog.ts`). Order prices always come
  from the server-side menu, never from the browser.
- **Abuse limits:** rate limiting (`src/lib/rate-limit.ts`) and a same-origin
  check on state-changing routes (`src/lib/csrf.ts`).
- **Payments:** card data never touches this server (Stripe Elements). Orders
  are only marked paid after the PaymentIntent is verified with Stripe, one
  payment per order, and the webhook verifies Stripe's signature.
- **Headers:** CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy and
  Permissions-Policy are set in `next.config.js`.
- **Pipeline:** CI runs tests, type-check, `npm audit` and a build; CodeQL scans
  the code; Dependabot proposes dependency updates; secret scanning and push
  protection are enabled.

Known limit: the in-memory rate limiter is per serverless instance, so it is a
brake on abuse, not a hard global cap. Use the host's firewall rules or a shared
store (Upstash/Vercel KV) when real traffic arrives.

## Secrets and rotation plan

All secrets live in environment variables (Vercel project settings for
production, `.env.local` for development) and never in the repository.

| Secret | Where it is issued | Rotate |
|---|---|---|
| `MONGODB_URI` (DB user password) | MongoDB Atlas → Database Access | Every 90 days, and immediately on any suspected leak |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Every 90 days (this signs out every session) |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials | Yearly, or on leak |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers | Yearly, or on leak (roll the key; Stripe keeps the old one valid briefly) |
| `GEMINI_API_KEY` | Google AI Studio | Every 90 days, and on leak |

Rotation steps: create the new value, update it in Vercel, redeploy, confirm the
app works, then revoke the old value. If a secret is ever committed, rotate it
**first**, then clean the history.

## Backups and recovery

- Enable Atlas continuous backup (or scheduled snapshots) and set a retention
  that matches how much order history can be lost.
- **Test the restore, not just the backup:** at least once per quarter restore
  the latest snapshot into a scratch cluster, point a local `.env.local` at it,
  and confirm orders and reports load. Record the date and how long it took.
- Keep a copy of the environment variable list (names only, not values) so a
  new Vercel project can be rebuilt quickly.

## Before going live with real customers

1. Switch Stripe to live keys only in the production environment, and confirm
   the publishable and secret keys match modes (`pk_live_` with `sk_live_`).
2. Run an **OWASP ZAP** baseline scan against a staging deployment
   (`docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t <url>`),
   fix findings, and consider an independent penetration test.
3. Use a database user limited to this app's database (`readWrite` only), and
   restrict the Atlas network allow-list instead of `0.0.0.0/0` where possible.
4. Require 2-step verification on every Google account that can sign in.
5. Set up alerts on the `"level":"security"` log lines (failed auth, rate-limit
   and cross-origin events) in your log tooling.
