import { Module } from '@nestjs/common';
import { CacheController } from './endpoints/cache/cache.controller';
import { MetricsController } from './endpoints/metrics/metrics.controller';
import { PublicAppModule } from './public.app.module';

@Module({
  imports: [
    PublicAppModule
  ],
  controllers: [
    MetricsController,
    CacheController
  ],
  providers: [
    
  ],
})
export class PrivateAppModule {}
