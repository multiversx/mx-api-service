import { Module } from '@nestjs/common';
import { CacheController } from './common/caching/cache.controller';
import { MetricsController } from './common/metrics/metrics.controller';
import { HealthCheckController } from './endpoints/health-check/health.check.controller';
import { ProcessNftsController } from './endpoints/process-nfts/process.nfts.controller';
import { ProcessNftsModule } from './endpoints/process-nfts/process.nfts.module';

@Module({
  imports: [
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
