import * as Sentry from "@sentry/nextjs";

const environment =
  process.env.NEXT_PUBLIC_APP_ENV ??
  process.env.NEXT_PUBLIC_VERCEL_ENV ??
  process.env.NODE_ENV;
const isProduction = environment === "production";
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment,
  sendDefaultPii: false,
  enableLogs: true,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampler: ({ name, inheritOrSampleWith }) => {
    if (name.includes("/api/db/health")) return 0;
    return inheritOrSampleWith(isProduction ? 0.1 : 1);
  },
  replaysSessionSampleRate: isProduction ? 0.1 : 1,
  replaysOnErrorSampleRate: 1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
