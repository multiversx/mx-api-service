import { Module } from '@nestjs/common';
import { CacheController } from './common/caching/cache.controller';
import { LoggingModule } from './common/logging/logging.module';
import { MetricsController } from './common/metrics/metrics.controller';
import { HealthCheckController } from './endpoints/health-check/health.check.controller';
import { ProcessNftsController } from './endpoints/process-nfts/process.nfts.controller';
import { ProcessNftsModule } from './endpoints/process-nfts/process.nfts.module';

@Module({
  imports: [
    LoggingModule,
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
