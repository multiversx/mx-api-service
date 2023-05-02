import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheWarmerService } from './cache.warmer.service';
import { EndpointsServicesModule } from '../../endpoints/endpoints.services.module';
import { KeybaseModule } from 'src/common/keybase/keybase.module';
import { MexModule } from 'src/endpoints/mex/mex.module';
import { AssetsModule } from 'src/common/assets/assets.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { NftCronModule } from '../nft/nft.cron.module';
import { GuestCacheWarmer } from '@multiversx/sdk-nestjs-cache';
import { PluginModule } from 'src/plugins/plugin.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EndpointsServicesModule,
    KeybaseModule,
    MexModule.forRoot(),
    DynamicModuleUtils.getRedisCacheModule(),
    AssetsModule,
    NftCronModule,
    PluginModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    GuestCacheWarmer,
    CacheWarmerService,
  ],
})
export class CacheWarmerModule { }
