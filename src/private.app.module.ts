import { Module } from '@nestjs/common';
import { CachingModule } from './common/caching/caching.module';
import { CacheController } from './common/caching/cache.controller';
import { MetricsController } from './common/metrics/metrics.controller';
import { MetricsModule } from './common/metrics/metrics.module';
import { ApiConfigModule } from './common/api-config/api.config.module';
import { MicroserviceModule } from './common/microservice/microservice.module';
import { HealthCheckController } from './endpoints/health-check/health.check.controller';

@Module({
  imports: [
    ApiConfigModule,
    CachingModule,
    MetricsModule,
    MicroserviceModule,
  ],
  controllers: [
    MetricsController,
    CacheController,
    HealthCheckController,
  ],
})
export class PrivateAppModule {}
