# Talentloom — freelancing marketplace MVP

A working two-sided marketplace. Clients post projects and hire freelancers. Freelancers build profiles and send proposals. Every journey below persists to a real database and is covered by tests.

## What works

| Area | Details |
| --- | --- |
| **Homepage** | Value proposition, live counts, keyword search, popular skills, category browsing, featured freelancers (available now, ranked by hires and portfolio), latest open projects, role-aware calls to action |
| **Freelancer profiles** | Headline, bio, category, hourly rate, availability, location, skills, and up to 12 portfolio items with links. Public profile pages. |
| **Freelancer search** | Keyword (name, headline, bio, skills), category, skill, hourly-rate range, availability, four sort orders, pagination, shareable URLs |
| **Projects** | Clients post and edit projects with title, description, category, fixed or hourly budget range, and required skills. Status moves through open → in progress → completed, or closed/reopened. |
| **Project listings** | Keyword, category, skill, budget type, minimum budget, and status filters; sorting; pagination; detail pages with client stats |
| **Proposals** | Freelancers apply with a cover letter, bid, and timeline, and can withdraw and reapply. Clients shortlist, decline, or hire. Hiring moves the project to *in progress* and declines the other pending proposals. |
| **Auth & roles** | Email/password accounts as a **client** or a **freelancer**. Each page and server action checks the role. |
| **Dashboards** | Clients see stats, all their projects with new/shortlisted counts, and a per-project review screen. Freelancers see profile status, stats, every proposal with its status, and recommended projects that match their skills. |

**Payments and messaging are not implemented.** Once a client hires someone, both sides see each other's email address and arrange the work and payment directly. The UI says this wherever it matters.

## Quick start

Requires **Node.js 22.12+** and npm. No database server is needed: data lives in a local SQLite file.

```bash
cd marketplace
npm install
cp .env.example .env      # adjust values if you like; no real secrets required
npm run setup             # creates data/marketplace.db and loads demo data
npm run dev               # http://localhost:3000
```

### Demo accounts

`npm run setup` (or `npm run db:seed`) loads 5 clients, 16 freelancers, 15 projects, and 18 proposals in every status. All demo accounts use the `SEED_DEMO_PASSWORD` from your `.env` (default `demo-password`):

| Role | Email | Try this |
| --- | --- | --- |
| Client | `client@example.com` | Review and hire from the proposals on *Rebuild our outdoor gear storefront* |
| Freelancer | `freelancer@example.com` | See submitted, shortlisted, and hired proposals, plus recommendations |

Every other seeded account (listed in `src/db/seed-data.ts`) uses the same password. You can also sign up with any email address; nothing is sent.

> **Seeding replaces all data.** Re-run `npm run db:seed` any time to reset the demo.

### Production-style run

```bash
npm run build
npm start                 # http://localhost:3000
```

In production mode session cookies are marked `Secure`. Chrome and Firefox accept that on `http://localhost`. If you serve the build over plain HTTP on another host, set `SESSION_COOKIE_SECURE="false"`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run setup` | `db:migrate` + `db:seed` |
| `npm run db:migrate` | Apply SQL migrations in `drizzle/` |
| `npm run db:seed` | Reset the database to the demo dataset (refuses to run with `NODE_ENV=production` unless `--force` is passed) |
| `npm run db:generate` | Generate a new migration after editing `src/db/schema.ts` |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit and service tests (Vitest) |
| `npm run test:e2e` | End-to-end browser tests (Playwright) |
| `npm run check` | Lint + typecheck + unit/service tests |

## Tests

```bash
npm test                            # 62 unit + integration tests, ~20s
npx playwright install chromium     # first time only
npm run test:e2e                    # 21 browser tests; builds the app first
```

- **Unit tests** (`tests/unit`) cover validation messages, money and slug formatting, password hashing, redirect safety, and search-parameter parsing.
- **Service tests** (`tests/integration`) run against a throwaway SQLite file per test file. They cover accounts and sessions, role checks, the whole proposal lifecycle (shortlist, decline, withdraw and reapply, hire, auto-decline, contact reveal), a race between two simultaneous hires, project status transitions, and every search filter on the seed data.
- **End-to-end tests** (`tests/e2e`) run against a production build with its own seeded database (`data/e2e.db`, so your dev data is untouched). They cover a new client posting a project, a new freelancer building a profile and applying, the client shortlisting and hiring, both sides seeing the result, withdrawals, filters and empty states, validation and focus handling, role-based access, login redirects, the skip link, and the mobile menu. Set `E2E_SKIP_BUILD=1` to reuse an existing build.

## Configuration

All configuration comes from environment variables. See `.env.example`; `.env` is git-ignored.

| Variable | Default in example | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:./data/marketplace.db` | libSQL/SQLite URL. A hosted libSQL (e.g. Turso) URL also works. |
| `DATABASE_AUTH_TOKEN` | *(empty)* | Only for remote libSQL databases |
| `SESSION_MAX_AGE_DAYS` | `30` | How long a login lasts |
| `SESSION_COOKIE_SECURE` | *(auto)* | Force the cookie's `Secure` flag on/off; defaults to on in production |
| `SEED_DEMO_PASSWORD` | `demo-password` | Password for every seeded demo account |
| `SHOW_DEMO_ACCOUNTS` | `true` | Show the demo-account hint on the login page. Set to `false` for real use. |
| `NEXT_PUBLIC_APP_NAME` | `Talentloom` | Display name. Inlined at build time, so rebuild after changing it. |

## How it's built

- **Next.js 16 (App Router) + React 19 + TypeScript.** Pages are server components that read data directly. Mutations are Server Actions, which carry Next's built-in origin checks against CSRF.
- **SQLite via Drizzle ORM and `@libsql/client`.** The schema is in `src/db/schema.ts`, with committed SQL migrations in `drizzle/`. Multi-step writes such as hiring run in transactions that re-check state, so two simultaneous hires can't both succeed.
- **Tailwind CSS 4** with a small component set in `src/components`. Icons come from `lucide-react`, and the Geist font is self-hosted.
- **Zod** validates every form on the server. Messages are written for people ("Maximum budget must be greater than or equal to the minimum.").

```
marketplace/
├── drizzle/                 SQL migrations
├── scripts/                 migrate + seed CLIs
├── src/
│   ├── app/                 routes (pages, loading states, 404/error pages)
│   ├── components/          UI primitives, forms, marketplace + dashboard components
│   ├── db/                  schema, client, seed data
│   ├── lib/                 auth (sessions, passwords), validation, formatting
│   ├── server/services/     business logic + authorization (framework-independent, unit-tested)
│   ├── server/actions/      thin Server Actions: parse form → call service → revalidate/redirect
│   └── proxy.ts             redirects signed-out visitors away from private pages
└── tests/                   unit/, integration/, e2e/
```

**Security.** Passwords are hashed with scrypt (N=2¹⁵, r=8, p=3, an OWASP-listed setting). Sessions are random 256-bit tokens in an `httpOnly`, `SameSite=Lax` cookie, and only the token's SHA-256 hash is stored. Failed logins take the same time whether or not the email exists. The service layer checks authorization for every mutation, independent of the UI. Post-login redirects only go to same-site paths. Portfolio links must be `http(s)`. Contact emails are revealed only to the two parties of an accepted proposal.

**Accessibility.** The app has semantic landmarks and a skip link, and every input has a visible label. Hints and errors are tied to their fields with `aria-describedby` and `aria-invalid`. After a failed submission, focus moves to the first invalid field. Status messages use live regions, and confirmations use a native `<dialog>` with focus management. The menus close on Escape. Focus rings are visible, status badges carry text as well as color, and animations respect `prefers-reduced-motion`.

## Limitations and next steps

These are deliberately out of scope for the MVP:

- **Payments and escrow:** not implemented; no payment data is collected.
- **Messaging:** there is no in-app chat. Email addresses are exchanged after a hire.
- **Account recovery and verification:** no password reset or email verification (no email sending at all), and no account deletion or settings page.
- **Abuse protection:** no rate limiting on login or sign-up, no CAPTCHA, and no admin or moderation tools.
- **Media:** no avatar or portfolio image uploads. Avatars are initials; portfolio items link out.
- **Reviews, ratings, notifications, invitations:** not built. "Featured" and "best match" ranking is based on availability, completed hires, and portfolio size.
- **Search:** case-insensitive substring matching with SQL `LIKE`, which is fine for thousands of rows. Larger catalogs would want SQLite FTS5 or a search service.
- **Hosting:** SQLite is ideal for local demos and a single server. Point `DATABASE_URL` at a hosted libSQL database (or port the Drizzle schema to Postgres) for multi-instance deployments.
- **Currency:** USD only, whole dollars.
