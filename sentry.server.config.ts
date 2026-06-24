import * as Sentry from "@sentry/nextjs";

const environment =
  process.env.SENTRY_ENVIRONMENT ??
  process.env.NEXT_PUBLIC_APP_ENV ??
  process.env.VERCEL_ENV ??
  process.env.NODE_ENV;
const isProduction = environment === "production";
const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment,
  sendDefaultPii: false,
  enableLogs: true,
  includeLocalVariables: true,
  tracesSampler: ({ name, inheritOrSampleWith }) => {
    if (name.includes("/api/db/health")) return 0;
    return inheritOrSampleWith(isProduction ? 0.1 : 1);
  },
});
