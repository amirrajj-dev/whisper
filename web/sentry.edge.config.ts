import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enableLogs: true,

  tracesSampler: (samplingContext) => {
    const { name } = samplingContext;
    if (!name) return 0;

    // Auth routes — higher visibility
    if (name.includes("/login") || name.includes("/register")) return 0.2;

    // App routes — business critical
    if (name.includes("/app") || name.includes("/profile") || name.includes("/settings")) return 0.1;

    // Landing page — low value
    if (name === "/" || name === "GET /") return 0.05;

    // Default
    return 0.1;
  },

  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies;
      delete event.request.data;
      if (event.request.headers) {
        delete event.request.headers["Cookie"];
        delete event.request.headers["cookie"];
        delete event.request.headers["Authorization"];
        delete event.request.headers["authorization"];
      }
    }
    if (event.user) {
      const id = event.user.id;
      event.user = {};
      if (id) event.user.id = id;
    }
    return event;
  },

  beforeSendLog(log) {
    if (log.level === "debug") {
      return null;
    }
    return log;
  },
});
