import * as Sentry from '@sentry/nestjs';

Sentry.init({
  environment: process.env.NODE_ENV || 'development',
  dsn: process.env.SENTRY_DSN,
  release: process.env.SENTRY_RELEASE,

  tracesSampler: (samplingContext) => {
    const { name } = samplingContext;
    if (!name) return 0;

    if (
      name.startsWith('GET /api/health') ||
      name.startsWith('GET /api/stats') ||
      name.startsWith('GET /api/online')
    )
      return 0;

    if (
      name.startsWith('POST /api/auth') ||
      name.startsWith('POST /api/push') ||
      name.startsWith('POST /api/upload')
    )
      return 1;

    if (
      name.startsWith('GET /api/user') ||
      name.startsWith('PATCH /api/user') ||
      name.startsWith('DELETE /api/user')
    )
      return 0.5;

    return 0.2;
  },

  beforeSend: (event) => {
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers['Cookie'];
        delete event.request.headers['Authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['authorization'];
      }
    }
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
      delete event.user.ip_address;
    }
    return event;
  },
});
