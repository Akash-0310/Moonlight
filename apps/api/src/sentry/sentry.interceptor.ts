import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/nestjs';
import type { Request } from 'express';

@Injectable()
export class SentryContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as any).user as { id: string; email: string; role?: string } | undefined;

    // Attach the authenticated user to the active Sentry scope for this request
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email });
      Sentry.setTag('user.role', user.role ?? 'customer');
    }

    Sentry.addBreadcrumb({
      type: 'http',
      category: 'request.incoming',
      message: `${req.method} ${req.path}`,
      level: 'info',
      data: {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return next.handle().pipe(
      tap({
        error: (err) => {
          Sentry.addBreadcrumb({
            type: 'http',
            category: 'request.error',
            message: `${req.method} ${req.path} → ${err?.status ?? 500}`,
            level: 'error',
            data: {
              status: err?.status ?? 500,
              error: String(err?.message ?? err),
            },
          });
        },
      }),
    );
  }
}
