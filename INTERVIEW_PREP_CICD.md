# CI/CD — Interview Prep (QuickServe POS)

How to talk about CI/CD for this project accurately and confidently.

## What is actually live (verified on GitHub)

| Piece | State |
|---|---|
| CI | GitHub Actions workflow `.github/workflows/ci.yml`, job `verify`, green on `main` |
| What CI runs | `npm ci --legacy-peer-deps`, `npx vitest run` (24 tests), `npx tsc --noEmit` (strict), `npm run build` |
| Triggers | Every push to `main` and every pull request |
| CD | Vercel deploys automatically from the GitHub repo (`vercel[bot]` Production deployments, Vercel status `success`) |
| Branch ruleset | `protect-main` is active: PR required, no deletion, no force-push, 0 required approvals |
| Required status check | **Not required.** CI reports pass/fail but does not block a merge or a deploy |
| Known gaps | Lint is broken, Stripe webhook route has no tests, no component or E2E tests |

Do not claim that CI blocks bad deploys. It doesn't: Vercel deploys from
`main` in parallel with `verify`.

---

## Part 1 — The interview answers

### The 45-second answer

> "I treat CI and CD as two jobs. CI asks 'is this change safe?' and CD asks
> 'get it live.' CI is a GitHub Actions workflow that runs on every push and
> pull request: it installs from the lockfile, runs 24 Vitest unit tests,
> type-checks with strict TypeScript, and does a full production build.
> Vercel handles CD, deploying automatically from the same GitHub repo, so I
> don't maintain deploy scripts. It's deliberately lightweight for a solo
> project. The next thing I'd add is making the CI check required so a
> failing build can't ship, plus tests for the Stripe webhook route, because
> that handles money and currently has none."

### The 2-minute answer (if they ask "walk me through it")

1. **Trigger:** every push to `main` and every pull request.
2. **Install:** `npm ci` installs exactly what the lockfile says and fails if
   `package.json` and the lockfile disagree, so builds are reproducible.
3. **Test:** 24 Vitest unit tests covering pricing and VAT math, cents
   conversion for Stripe, menu search, and the API data layer. `fetch` is
   mocked, so they take about a second and need no database.
4. **Type-check:** `tsc --noEmit` with `strict: true` fails fast with a
   precise error.
5. **Build:** `npm run build` proves every route compiles, the same thing
   production does.
6. **Deploy:** Vercel deploys from GitHub on every push to `main`.
7. **Result:** a green or red `verify` check on every commit and PR.

### The story worth telling (shows the pipeline works)

> "My first CI run failed. Tests and type-check passed, but the build
> crashed with 'Please define MONGODB_URI', because my database module
> throws at import time and CI has no `.env` file. My local build had
> passed because my env files were present. I fixed it by giving the build
> step dummy environment values in the workflow, since the build never
> connects to a database, rather than touching the app code. That's exactly
> the kind of 'works on my machine' problem CI exists to catch."

---

## Part 2 — Questions and answers

### Q1. What's the difference between CI and CD?

**A.** CI (continuous integration) automatically verifies every change:
tests, type-check, build. CD (continuous delivery/deployment) automatically
ships a change. I use GitHub Actions for CI and Vercel for CD.

### Q2. Does your CI block bad code from being deployed?

**A.** No, and I'd rather say that plainly. Vercel deploys from `main` on
its own, in parallel with my CI job, and I haven't made the CI check a
required status check. So CI tells me quickly whether a change is good, but
it isn't a gate. For a solo project I accepted that tradeoff. With a team or
real customers I'd mark `verify` as a required check in the branch ruleset,
and either deploy only after it passes or rely on Vercel's rollback.

### Q3. Why GitHub Actions?

**A.** The code is already on GitHub, so there's no extra service to manage.
The pipeline is one YAML file in the repo, version-controlled and reviewed
like code, and free at this scale.

### Q4. Why not a bigger pipeline with staging, Docker, E2E, and coverage gates?

**A.** Right-sizing. One developer and an early-stage project: a minimal
pipeline catches most real breakage for about ten minutes of setup.
Staging, containers, and coverage thresholds add maintenance cost that pays
off with a team or more traffic. I'd add them when the project needs them.

### Q5. Why `npm ci` instead of `npm install`?

**A.** `npm ci` is deterministic: it installs exactly what's in
`package-lock.json` and errors if the lockfile is out of sync. I add
`--legacy-peer-deps` because the repo has a pre-existing peer-dependency
conflict between `eslint` and `eslint-config-next`.

### Q6. Why run `tsc --noEmit` if the build already type-checks?

**A.** It fails earlier and clearer. Cheap checks (tests, types) run before
the expensive build, so the common failures give fast, precise feedback.

### Q7. How do you handle secrets?

**A.** Real secrets (MongoDB URI, Stripe keys, Google OAuth, Gemini key) are
never committed: `.env` and `.env.local` are git-ignored and only
`.env.example` with placeholders is in the repo. Tests mock everything so
they need no secrets. The CI build uses clearly fake dummy values. Production
secrets live in Vercel's environment variables.

### Q8. What did you learn from the first failed CI run?

**A.** That local success proves less than it seems. My build passed locally
only because my `.env` files existed. CI starts from a clean checkout, so it
exposed an import-time dependency on `MONGODB_URI`. I fixed it in the
workflow with dummy values. A further improvement would be making that
module fail lazily instead of at import, which I'd only do with care because
it sits near auth code.

### Q9. How would you handle a bad deploy that gets through?

**A.** Vercel keeps every previous deployment, so rollback is promoting the
last good one, which takes seconds. Then I'd write a failing test that
reproduces the bug before fixing it, so it can't ship twice.

### Q10. Why is lint missing from the pipeline?

**A.** It's currently broken, and I'd rather be upfront. Next.js 16 removed
the `next lint` subcommand and the repo has no ESLint config, so
`npm run lint` fails before checking anything. Adding it would make every run
red for an unrelated reason. The order is: migrate to the ESLint CLI with a
proper config, confirm it passes locally, then add it to CI.

### Q11. How does the pipeline cover payment code?

**A.** The pure payment logic (order totals, VAT, converting to cents) has
unit tests, including a floating-point-drift case, so a rounding bug fails CI
instead of charging the wrong amount. The Stripe webhook route has no tests
yet. That's my highest-value gap because it handles money and signature
verification.

### Q12. What would you add next, in priority order?

**A.**
1. Make the `verify` check required in the branch ruleset so a red build
   can't merge.
2. Tests for the Stripe webhook route: bad signature rejected, valid event
   handled, duplicate events not processed twice.
3. Fix lint and add it to the pipeline.
4. Component tests (React Testing Library) for cart and checkout.
5. A small Playwright smoke test (login, add item, place order) against the
   Vercel preview URL.

### Q13. How does AI tooling fit into this?

**A.** I use an AI coding agent for setup work and keep the judgment myself.
It built the Vitest setup and the workflow, and when the first CI run failed
it read the actual GitHub logs to find the cause instead of guessing. I
check claims against the real repo state, for example confirming through
GitHub that the check is green and that Vercel is really deploying.

---

## Part 3 — The workflow (as committed)

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci --legacy-peer-deps

      - name: Unit tests
        run: npx vitest run

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          # Dummy values so modules that read env at import time can load.
          # The build never connects to a database.
          MONGODB_URI: mongodb://localhost:27017/ci
          NEXTAUTH_SECRET: ci-dummy-secret
          NEXTAUTH_URL: http://localhost:3000
```

`concurrency` cancels superseded runs on the same branch, and
`timeout-minutes` stops a hung job from burning minutes.

---

## Part 4 — Cheat sheet

| Question | One-liner |
|---|---|
| Tools | GitHub Actions (CI), Vercel (CD), Vitest, strict TypeScript |
| What runs | `npm ci`, `vitest run`, `tsc --noEmit`, `npm run build` |
| When | Every push to `main`, every PR |
| Does it block deploys | No. CI is informational; Vercel deploys in parallel |
| Secrets | Never in repo; Vercel env vars for prod; dummy values in CI build |
| Known gaps | Lint broken, webhook untested, no component or E2E tests |
| Next addition | Required check, Stripe webhook tests, lint, component tests |
