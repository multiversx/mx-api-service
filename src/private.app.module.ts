import { Module } from '@nestjs/common';
import { CachingModule } from './common/caching/caching.module';
import { CacheController } from './common/caching/cache.controller';
import { MetricsController } from './common/metrics/metrics.controller';
import { MetricsModule } from './common/metrics/metrics.module';
import { ApiConfigModule } from './common/api-config/api.config.module';
import { MicroserviceModule } from './common/microservice/microservice.module';
import { HealthCheckController } from './endpoints/health-check/health.check.controller';
import { ProcessNftsController } from './endpoints/process-nfts/process.nfts.controller';
import { ProcessNftsModule } from './endpoints/process-nfts/process.nfts.module';

@Module({
  imports: [
    ApiConfigModule,
    CachingModule,
    MetricsModule,
    MicroserviceModule,
    ProcessNftsModule,
  ],
  controllers: [
    MetricsController,
    CacheController,
    HealthCheckController,
    ProcessNftsController,
  ],
})
export class PrivateAppModule { }
