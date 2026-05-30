import * as Sentry from '@sentry/nestjs';
import type { ErrorEvent, EventHint } from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const env = process.env.NODE_ENV ?? 'development';
const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  environment: env,
  release: `moonlight@${process.env.npm_package_version ?? '0.0.1'}`,

  integrations: [
    // CPU profiling — captures flame graphs for sampled transactions
    nodeProfilingIntegration(),
    // Auto-instrument Prisma queries as db spans
    Sentry.prismaIntegration(),
    // Auto-instrument outgoing HTTP calls with trace propagation
    Sentry.httpIntegration(),
  ],

  // 100% in dev/staging, 10% in production — tune via env var
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? (env === 'production' ? '0.1' : '1.0')),

  // Profile every sampled transaction
  profilesSampleRate: 1.0,

  // Don't flood Sentry with routine client mistakes — only security + server errors
  beforeSend(event: ErrorEvent, hint: EventHint) {
    const err = hint?.originalException as any;
    const status: number | undefined = err?.status ?? err?.getStatus?.();

    if (status && status >= 400 && status < 500 && status !== 401 && status !== 403) {
      return null;
    }

    // Scrub sensitive fields from request bodies before sending
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>;
      ['password', 'passwordHash', 'token', 'refreshToken', 'cardNumber', 'cvv'].forEach(
        (field) => { if (field in data) data[field] = '[Filtered]'; },
      );
    }

    return event;
  },

  // Drop noisy health-check transactions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeSendTransaction(event: any) {
    if (event.transaction?.includes('/health')) return null;
    return event;
  },

  ignoreErrors: [
    'Non-Error promise rejection captured with value: undefined',
    'ResizeObserver loop limit exceeded',
  ],

  // Only attach PII (user email, IP) in non-production environments
  sendDefaultPii: env !== 'production',
});
