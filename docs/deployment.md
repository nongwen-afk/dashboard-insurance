# Deployment Policy

This project uses Vercel for application deployments and Neon Postgres for data storage. CI validates code and migration files before merge. Production database changes must remain a controlled release step.

## Branches And Environments

| Branch or event | Vercel target | Database target | Notes |
| --- | --- | --- | --- |
| Pull request | Preview | Non-production Neon database or branch | CI must pass before review/merge. |
| `dev` push | Preview or non-production deployment | Non-production Neon database or branch | Used for team verification. |
| `main` push | Production deployment | Production Neon database | Only after reviewed changes are merged. |
| Manual hotfix | Production deployment | Production Neon database | Requires the same CI and migration review gates. |

Preview and development deployments must never point at the production database.

## Required CI Gates

The GitHub Actions pipeline is split into three sequential workflows:

1. `1. Code Quality Checks`
   - verifies committed migration files match `db/schema.ts`
   - runs ESLint, TypeScript validation, and Vitest coverage
2. `2. Database Migration`
   - verifies `TEST_DATABASE_URL` points at the expected non-production Neon branch
   - applies committed migrations with `pnpm db:migrate`
3. `3. E2E Tests`
   - builds the application against the test database
   - runs Playwright in Chromium, Firefox, and WebKit
   - uploads reports, screenshots, videos, and traces for 30 days

Each workflow checks out the exact commit that passed the preceding workflow.
Database migration and E2E jobs do not run for pull requests from forks because
those jobs require repository secrets.

The migration check fails when `db/schema.ts` can generate new files under `drizzle/` that were not committed. This protects the team from merging schema changes without migration files.

## GitHub Actions Secrets

Configure these repository secrets before enabling the migration and E2E
workflows:

| Secret | Required | Purpose |
| --- | --- | --- |
| `TEST_DATABASE_URL` | Yes | Connection string for the dedicated non-production Neon test branch. |
| `TEST_DATABASE_BRANCH_ID` | Yes | Expected Neon branch ID for the test database. The pipeline refuses to continue when it does not match the connected database. |
| `PRODUCTION_DATABASE_BRANCH_ID` | Recommended | Production Neon branch ID. The guard rejects a configuration where test and production IDs are equal. |

Never put the production database URL in `TEST_DATABASE_URL`.

## Migration Release Rules

Use this workflow when a feature changes the database schema:

1. Change the schema in `db/schema.ts`.
2. Generate SQL with `pnpm db:generate`.
3. Review the generated files in `drizzle/`.
4. Run `pnpm db:migrate` against a non-production database.
5. Let CI validate that no migration drift remains.
6. Apply production migration only after review and approval.
7. Deploy or promote the already validated app build.

Production migration commands must be run intentionally. Do not run these commands against production:

```text
pnpm db:push
pnpm db:seed
pnpm db:reset
```

Use `pnpm db:migrate` for production only after confirming the migration SQL is safe for existing data.

## Production Migration Checklist

Before applying a production migration:

- CI is green on the commit being deployed.
- The generated SQL in `drizzle/` has been reviewed.
- The migration has been tested against non-production.
- The production `DATABASE_URL` is confirmed to point at the production Neon database.
- A rollback or mitigation plan is known for destructive changes.
- No seed/reset command is part of the production release.

After applying the migration:

- Confirm `drizzle.__drizzle_migrations` contains the new migration record.
- Open `/api/db/health` on the target deployment.
- Verify the dashboard loads key data.
- Check Vercel deployment status and recent error logs.

## Branch Protection

Recommended GitHub branch protection:

| Branch | Required checks | Extra rule |
| --- | --- | --- |
| `dev` | Code Quality, Database Migration, E2E Tests | Require pull request before merge when possible. |
| `main` | Code Quality, Database Migration, E2E Tests | Require pull request review and no direct pushes. |

The required checks should use the jobs from the three numbered workflow files
under `.github/workflows/`.

## Vercel Environment Variables

Configure Vercel variables with environment scoping:

| Vercel environment | `DATABASE_URL` | `NEXT_PUBLIC_APP_ENV` |
| --- | --- | --- |
| Development | Non-prod Neon database | `local` |
| Preview | Non-prod Neon database | `preview` |
| Production | Production Neon database | `production` |

`NEXT_PUBLIC_*` variables are visible in the browser. Never put secrets in public variables.
