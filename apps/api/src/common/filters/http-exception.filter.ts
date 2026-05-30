import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Scope } from '@sentry/nestjs';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string | string[]) ?? exception.message;
      }
    } else if (exception instanceof Error) {
      // Never leak internal error details to clients in production
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
      this.logger.error(exception.message, exception.stack);
    }

    // Report to Sentry:
    // - Always report 5xx (server errors)
    // - Report 401/403 (security events worth tracking)
    // - Skip routine 4xx (validation errors, not-found, etc.) — too much noise
    const shouldCapture = status >= 500 || status === 401 || status === 403;
    if (shouldCapture) {
      Sentry.withScope((scope: Scope) => {
        scope.setTag('http.status_code', String(status));
        scope.setTag('http.method', request.method);
        scope.setTag('http.path', request.path);
        scope.setExtra('request.query', request.query);
        scope.setExtra('request.body', sanitizeBody(request.body));

        const user = (request as any).user as { id: string; email: string } | undefined;
        if (user) scope.setUser({ id: user.id, email: user.email });

        // Give Prisma constraint violations a stable fingerprint so they group together
        if ((exception as any)?.code === 'P2002') {
          scope.setFingerprint(['prisma-unique-constraint', request.path]);
        }

        Sentry.captureException(exception);
      });
    }

    const body: ErrorResponse = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const sensitive = new Set(['password', 'passwordHash', 'token', 'refreshToken', 'cardNumber', 'cvv', 'secret']);
  const clone = { ...(body as Record<string, unknown>) };
  for (const key of sensitive) {
    if (key in clone) clone[key] = '[Filtered]';
  }
  return clone;
}
