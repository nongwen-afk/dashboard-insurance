This is a Next.js fleet document dashboard using Neon Postgres and Drizzle ORM.

## Getting Started

Install dependencies and run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Setup

Environment variables are managed through Vercel and local `.env.local` files.

1. Link the local project to Vercel if it is not linked yet:

```bash
vercel link
```

2. Pull the development or preview variables locally:

```bash
vercel env pull .env.local --yes
```

If you are not using Vercel envs locally, copy `.env.example` to `.env.local` and set the values manually:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Scope | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Server only | Neon/Postgres connection string. Local, preview, and staging must use non-production databases. |
| `NEXT_PUBLIC_APP_ENV` | Browser visible | Non-secret label such as `local`, `preview`, `staging`, or `production`. |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser visible | Sentry project DSN. Leave empty to disable monitoring locally. |
| `SENTRY_ORG` | Build only | Sentry organization slug used for source map uploads. |
| `SENTRY_PROJECT` | Build only | Sentry project slug used for source map uploads. |
| `SENTRY_AUTH_TOKEN` | Build secret | Sentry token with release/source map permissions. |

Do not commit real secrets. Keep local secrets in `.env.local`, and configure Vercel-scoped values for Development, Preview, and Production.

## Database Environments

Use separate Neon databases or branches for production and non-production work.

| Environment | Database | Allowed database commands |
| --- | --- | --- |
| Local | Non-prod/local Neon branch | `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed` |
| Preview/Staging | Non-prod Neon branch | `pnpm db:migrate`; seed only when intentionally resetting test data |
| Production | Production Neon database | `pnpm db:migrate` only after review/approval |

Never run `pnpm db:push`, `pnpm db:seed`, or `pnpm db:reset` against production.

## Schema And Migrations

The Drizzle schema source is [`db/schema.ts`](db/schema.ts). SQL migrations live in [`drizzle/`](drizzle/).

When a feature changes the database schema:

```bash
pnpm db:generate
```

Review the generated SQL in `drizzle/`, then apply it to the intended non-production database:

```bash
pnpm db:migrate
```

Use `pnpm db:push` only for local prototyping when you intentionally do not need a migration file. Committed schema changes should be migration-based.

To seed mock documents in a non-production environment:

```bash
pnpm db:seed
```

## Health Check

Start the app and test the database connection:

```bash
pnpm dev
```

Open [http://localhost:3000/api/db/health](http://localhost:3000/api/db/health). A successful connection returns `{ "ok": true }`.

## Sentry Monitoring

The application uses `@sentry/nextjs` for:

- browser, Node.js, and Edge error monitoring
- App Router navigation and request tracing
- privacy-first Session Replay with text, inputs, and media masked
- readable production stack traces through source map upload

Production tracing samples 10% of transactions and Session Replay samples 10%
of normal sessions. Error replays are always retained. Non-production uses
100% sampling to make verification easier. The database health endpoint is
excluded from tracing noise.

Sentry is disabled automatically when `NEXT_PUBLIC_SENTRY_DSN` is empty.
Source maps upload only when `SENTRY_ORG`, `SENTRY_PROJECT`, and
`SENTRY_AUTH_TOKEN` are available during the Vercel build.

## Verification

Before pushing changes that can trigger deployment, run:

```bash
pnpm run lint
pnpm run typecheck
pnpm run test:coverage
pnpm run build
```

To run the Playwright smoke tests locally:

```bash
pnpm exec playwright install
pnpm run build
pnpm run test:e2e
```

The three-stage GitHub Actions pipeline performs code quality checks, migrates
the dedicated test database, and then runs Playwright E2E tests. See
[Deployment Policy](docs/deployment.md) for required GitHub secrets and safety
rules.

## Deploy On Vercel

Production deployments must use production-scoped Vercel environment variables. Preview deployments must not point at the production database.

Database migrations for production should run only after CI passes and the migration SQL has been reviewed.

See [Deployment Policy](docs/deployment.md) for the branch, environment, and migration release rules.
