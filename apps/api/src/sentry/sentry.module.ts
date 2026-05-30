import { Global, Module } from '@nestjs/common';
import { SentryService } from './sentry.service';
import { SentryContextInterceptor } from './sentry.interceptor';

@Global()
@Module({
  providers: [SentryService, SentryContextInterceptor],
  exports: [SentryService, SentryContextInterceptor],
})
export class SentryAppModule {}
