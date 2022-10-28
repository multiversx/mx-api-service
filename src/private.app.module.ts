import { Module } from '@nestjs/common';
import { RemoteCacheController } from './endpoints/caching/remote.cache.controller';
import { ApiMetricsController } from './common/metrics/api.metrics.controller';
import { SwappableSettingsController } from './endpoints/swappable-settings/swappable.settings.controller';
import { HealthCheckController } from './endpoints/health-check/health.check.controller';
import { ProcessNftsPrivateController } from './endpoints/process-nfts/process.nfts.private.controller';
import { ProcessNftsModule } from './endpoints/process-nfts/process.nfts.module';
import { LoggingModule } from '@elrondnetwork/erdnest';
import { DynamicModuleUtils } from './utils/dynamic.module.utils';
import { SwappableSettingsModule } from './endpoints/swappable-settings/swappable.settings.module';


@Module({
  imports: [
    LoggingModule,
    ProcessNftsModule,
    SwappableSettingsModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
    DynamicModuleUtils.getPubSubService(),
  ],
  controllers: [
    SwappableSettingsController,
    ApiMetricsController,
    RemoteCacheController,
    HealthCheckController,
    ProcessNftsPrivateController,
  ],
})
export class PrivateAppModule { }
