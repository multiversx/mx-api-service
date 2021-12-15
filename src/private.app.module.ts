import { Module } from '@nestjs/common';
import { CachingModule } from './common/caching/caching.module';
import { CacheController } from './common/caching/cache.controller';
import { MetricsController } from './common/metrics/metrics.controller';
import { MetricsModule } from './common/metrics/metrics.module';
import { ApiConfigModule } from './common/api-config/api.config.module';
import { MicroserviceModule } from './common/microservice/microservice.module';
import { HealthCheckController } from './endpoints/health-check/health.check.controller';
import { GenerateThumbnailController } from './endpoints/generate-thumbnails/generate.controller';
import { GenerateThumbnailModule } from './endpoints/generate-thumbnails/generate.thumbnail.module';

@Module({
  imports: [
    ApiConfigModule,
    CachingModule,
    MetricsModule,
    MicroserviceModule,
    GenerateThumbnailModule,
  ],
  controllers: [
    MetricsController,
    CacheController,
    HealthCheckController,
    GenerateThumbnailController
  ],
})
export class PrivateAppModule { }
