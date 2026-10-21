# CI/CD — Interview Prep (QuickServe POS)

How to talk about CI/CD for this project honestly and confidently.

> **Status check before the interview:** the CI workflow below is designed
> but NOT yet committed to the repo (there is no `.github/` folder on GitHub
> and no Actions runs). Either commit it first, or use the "current state"
> wording in Part 1. Never say "my pipeline runs..." unless it does.

---

## Part 1 — The interview answers

### The 45-second answer (say it in your own words)

> "I treat CI/CD as two separate jobs. CI answers 'is this change safe?' and
> CD answers 'get it live'. For QuickServe, CI is a GitHub Actions workflow
> that runs on every push and pull request: it installs from the lockfile,
> runs the Vitest suite, type-checks with strict TypeScript, and does a full
> production build. Branch protection on `main` blocks the merge if any step
> is red. CD I leave to Vercel, which deploys from the same GitHub repo, so I
> don't maintain deploy scripts. The reason I care is the Stripe payment
> flow: money code shouldn't reach `main` unchecked. The next thing I'd add
> is tests for the Stripe webhook route and lint in the pipeline."

### If your CI is not committed yet — the honest version

> "Today my safety net is local plus Vercel's build: Vitest runs
> automatically before the dev server starts via a `predev` script, strict
> TypeScript catches type errors, and Vercel's build fails on compile
> errors. I've designed the GitHub Actions workflow — test, type-check,
> build on every PR with branch protection — and it's the next thing I'm
> committing, because with payments in the app I don't want to rely on
> remembering to run checks."

### The 2-minute answer (if they ask "walk me through it")

1. **Trigger:** every push to `main` and every pull request.
2. **Install:** `npm ci` — installs exactly what the lockfile says, fails if
   `package.json` and the lockfile disagree. Deterministic.
3. **Test:** `npm test` runs 24 Vitest unit tests (pricing and VAT math,
   cents conversion for Stripe, menu search, and the API data layer) with
   `fetch` mocked, so they take about a second and need no database.
4. **Type-check:** `npx tsc --noEmit` with `strict: true`. Cheap and catches
   a whole class of bugs the tests don't.
5. **Build:** `npm run build` proves the app actually compiles and every
   route builds, the same thing production will do.
6. **Gate:** branch protection requires the check to pass before merge.
7. **Deploy:** Vercel deploys from GitHub. PRs get preview deployments, and
   merges to `main` go to production.

---

## Part 2 — Questions and answers

### Q1. What's the difference between CI and CD?

**A.** CI (continuous integration) automatically verifies every change:
tests, type-check, build. CD (continuous delivery/deployment) automatically
ships a verified change. I keep them separate: GitHub Actions does CI,
Vercel does CD. That way a broken change is stopped before the deploy step
even starts.

### Q2. Why GitHub Actions?

**A.** The code already lives on GitHub, so there's no extra service,
account, or webhook to manage. Workflows are a single YAML file in the repo,
so the pipeline is version-controlled and reviewed like any other code, and
it's free for a project this size.

### Q3. Why not build a full pipeline with staging, Docker, E2E, and coverage gates?

**A.** Right-sizing. This is an early-stage project with one developer. A
minimal pipeline (test, type-check, build) catches most real breakage for
about ten minutes of setup. Staging environments, containers, and coverage
thresholds add maintenance cost that only pays off with a team or more
traffic. I'd add them when the project needs them, not before.

### Q4. Why `npm ci` instead of `npm install`?

**A.** `npm ci` is deterministic: it installs exactly the versions in
`package-lock.json` and errors if the lockfile is out of sync. `npm install`
can silently change the lockfile. In CI you want reproducible builds. I add
`--legacy-peer-deps` because the repo has a pre-existing peer-dependency
conflict between `eslint` and `eslint-config-next`, which I flagged rather
than hid.

### Q5. Why run `tsc --noEmit` when the build already type-checks?

**A.** It gives a faster, clearer failure. The type-check step fails in
seconds with a precise error, instead of failing deep inside a build log.
Ordering cheap checks first (tests, types) and the expensive one (build)
last means quick feedback on the common failures.

### Q6. What do you do about secrets in CI?

**A.** Real secrets (MongoDB URI, Stripe keys, Google OAuth, Gemini key) are
never in the repo: `.env` and `.env.local` are git-ignored, and only
`.env.example` with placeholders is committed. My tests mock everything, so
they need no secrets. If a build step ever needs a variable, I'd add it as a
GitHub Actions secret or use a dummy value, never commit the real one. For
production, secrets live in Vercel's environment variables.

### Q7. Your build ran fine locally. Will it pass in CI?

**A.** Not guaranteed, and I'd verify on the first run. My local builds ran
with `.env` files present, and CI has none. Stripe is initialised lazily
inside a getter, so it shouldn't need keys at build time, but other modules
read env vars (for example the MongoDB URI). If the first CI build fails on
a missing variable, the fix is to supply a dummy value in the workflow's
`env:` block, not a real secret.

### Q8. How do you stop a broken change reaching production?

**A.** Three layers:
1. Locally, a `predev` script runs the tests before the dev server starts.
2. On every PR, CI runs tests, type-check, and build.
3. Branch protection on `main` requires that check to pass, so a red build
   can't be merged, and Vercel only deploys what lands on `main`.

### Q9. How would you handle a bad deploy that gets through anyway?

**A.** Vercel keeps every previous deployment, so rollback is promoting the
last good one, which takes seconds and needs no code change. After that I'd
write a failing test that reproduces the bug before fixing it, so the same
regression can't ship twice.

### Q10. Why is lint missing from your pipeline?

**A.** Because it's currently broken and I'd rather be upfront than hide it.
Next.js 16 removed the `next lint` subcommand, and the repo has no ESLint
config, so `npm run lint` fails before checking anything. Adding it would
make every CI run red for a reason unrelated to the change. The right order
is: migrate to the ESLint CLI with a proper config, confirm it passes
locally, then add it to the pipeline.

### Q11. How does your pipeline handle the payment code specifically?

**A.** The pure payment logic (order totals, VAT, converting to cents) has
unit tests, including a floating-point-drift case, so a rounding bug fails CI
instead of charging the wrong amount. The Stripe webhook route doesn't have
tests yet. That's the highest-value gap, because it handles money and
signature verification, and it's the first thing I'd cover next.

### Q12. What would you add next, in priority order?

**A.**
1. Commit the workflow and turn on branch protection (if not already done).
2. Tests for the Stripe webhook route: bad signature rejected, valid event
   handled, duplicate events not processed twice.
3. Fix the lint setup and add it to the pipeline.
4. Component tests with React Testing Library for the cart and checkout.
5. A small Playwright smoke test (login, add item, place order) run against
   the Vercel preview URL, for end-to-end confidence.

### Q13. How did AI tooling fit into this?

**A.** I use an AI coding agent for the setup work but keep the judgment
myself. For example, when the project had no test runner, the agent flagged
that my "tests must pass" rule couldn't be satisfied, I decided to add
Vitest, and it built the config, wrote the tests, and ran tests, type-check,
and a production build before reporting done. I verify against the actual
repo state, for instance checking GitHub directly to confirm what CI
exists, rather than trusting a summary.

---

## Part 3 — The workflow file

Save as `.github/workflows/ci.yml`:

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
        run: npm test

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        # If this fails on a missing env var, add dummy values here, e.g.
        # env:
        #   MONGODB_URI: mongodb://localhost:27017/ci
        #   NEXTAUTH_SECRET: ci-dummy-secret
```

Why the extras: `concurrency` cancels superseded runs on the same branch, and
`timeout-minutes` stops a hung job from burning minutes.

### Turn on branch protection

GitHub repo, then Settings, Branches, Add rule for `main`:
- Require a pull request before merging
- Require status checks to pass, and select `verify`

---

## Part 4 — Cheat sheet

| Question | One-liner |
|---|---|
| Tools | GitHub Actions (CI), Vercel (CD), Vitest, TypeScript strict |
| What runs | `npm ci`, `npm test`, `tsc --noEmit`, `npm run build` |
| When | Every push to `main`, every PR |
| What blocks a merge | Any red step, via branch protection |
| Secrets | Never in repo; Vercel env vars for prod; tests mock everything |
| Known gap | Lint broken (Next 16 dropped `next lint`, no ESLint config) |
| Next addition | Stripe webhook tests, then lint, then component and E2E tests |
