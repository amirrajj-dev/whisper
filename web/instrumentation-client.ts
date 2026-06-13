import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  enableLogs: true,

  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],

  beforeSend(event) {
    if (event.user) {
      const id = event.user.id;
      event.user = {};
      if (id) event.user.id = id;
    }
    return event;
  },

  beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    if (
      breadcrumb.category === "console" &&
      breadcrumb.message &&
      typeof breadcrumb.message === "string"
    ) {
      const msg = breadcrumb.message.toLowerCase();
      if (
        msg.includes("message") ||
        msg.includes("chat") ||
        msg.includes("notification") ||
        msg.includes("conversation")
      ) {
        return null;
      }
    }
    return breadcrumb;
  },

  beforeSendLog(log) {
    if (log.level === "debug") {
      return null;
    }
    return log;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
