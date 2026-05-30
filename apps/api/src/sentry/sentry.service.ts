import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { SeverityLevel, Breadcrumb, Scope } from '@sentry/nestjs';

type StartSpanOptions = Parameters<typeof Sentry.startSpan>[0];
import type { Request } from 'express';

export interface SentryUser {
  id: string;
  email: string;
  role?: string;
}

@Injectable()
export class SentryService {
  // ─── Exception capture ─────────────────────────────────────────────────────

  captureException(error: unknown, extras?: Record<string, unknown>): void {
    Sentry.withScope((scope: Scope) => {
      if (extras) {
        Object.entries(extras).forEach(([k, v]) => scope.setExtra(k, v));
      }
      Sentry.captureException(error);
    });
  }

  captureMessage(message: string, level: SeverityLevel = 'info'): void {
    Sentry.captureMessage(message, level);
  }

  // ─── Context setters ───────────────────────────────────────────────────────

  setUser(user: SentryUser | null): void {
    Sentry.setUser(user);
  }

  setTag(key: string, value: string | number | boolean): void {
    Sentry.setTag(key, String(value));
  }

  setExtra(key: string, value: unknown): void {
    Sentry.setExtra(key, value);
  }

  addBreadcrumb(crumb: Breadcrumb): void {
    Sentry.addBreadcrumb(crumb);
  }

  // ─── Performance spans ─────────────────────────────────────────────────────

  async startSpan<T>(options: StartSpanOptions, callback: () => T | Promise<T>): Promise<T> {
    return Sentry.startSpan(options, async () => callback());
  }

  // ─── HTTP request context ──────────────────────────────────────────────────

  setRequestContext(req: Request): void {
    const user = (req as any).user as SentryUser | undefined;

    Sentry.withScope((scope: Scope) => {
      scope.setTag('http.method', req.method);
      scope.setTag('http.path', req.path);

      scope.addEventProcessor((event) => {
        event.request = {
          method: req.method,
          url: req.originalUrl,
          headers: req.headers as Record<string, string>,
          query_string: req.query as Record<string, string>,
        };
        return event;
      });

      if (user) {
        scope.setUser({ id: user.id, email: user.email });
        scope.setTag('user.role', user.role ?? 'customer');
      }
    });
  }

  // ─── BullMQ job context ────────────────────────────────────────────────────

  captureJobException(
    error: unknown,
    jobName: string,
    queueName: string,
    jobId: string | undefined,
    jobData: unknown,
    attemptsMade?: number,
  ): void {
    Sentry.withScope((scope: Scope) => {
      scope.setTag('queue.name', queueName);
      scope.setTag('job.name', jobName);
      scope.setTag('job.id', jobId ?? 'unknown');
      scope.setExtra('job.data', jobData);
      scope.setExtra('job.attempts', attemptsMade ?? 0);
      // Group all failures of the same job type together in Sentry
      scope.setFingerprint(['queue-job-failure', queueName, jobName]);
      Sentry.captureException(error);
    });
  }

  // ─── Scope isolation ───────────────────────────────────────────────────────

  withScope<T>(callback: (scope: Sentry.Scope) => T): T {
    return Sentry.withScope(callback);
  }
}
