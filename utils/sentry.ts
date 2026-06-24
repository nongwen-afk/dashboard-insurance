import * as Sentry from "@sentry/nextjs";

type HandledErrorContext = {
  operation: string;
  route?: string;
};

export function captureHandledError(
  error: unknown,
  { operation, route }: HandledErrorContext,
) {
  Sentry.withScope((scope) => {
    scope.setTag("error.handled", "true");
    scope.setTag("operation", operation);

    if (route) {
      scope.setTag("route", route);
    }

    Sentry.captureException(error);
  });
}
