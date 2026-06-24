import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET() {
  // Deliberately trigger an error to test Sentry exception capture
  const testError = new Error("Sentry SDK Verification: Test unhandled error");
  Sentry.captureException(testError);
  throw testError;
}
