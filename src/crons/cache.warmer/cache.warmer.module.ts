import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheWarmerService } from './cache.warmer.service';
import { EndpointsServicesModule } from '../../endpoints/endpoints.services.module';
import { KeybaseModule } from 'src/common/keybase/keybase.module';
import { MexModule } from 'src/endpoints/mex/mex.module';
import { AssetsModule } from 'src/common/assets/assets.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { NftCronModule } from '../nft/nft.cron.module';
import { GuestCachingWarmer } from '@multiversx/sdk-nestjs';
import { PluginModule } from 'src/plugins/plugin.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EndpointsServicesModule,
    KeybaseModule,
    MexModule.forRoot(),
    AssetsModule,
    NftCronModule,
    PluginModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    GuestCachingWarmer,
    CacheWarmerService,
  ],
})
export class CacheWarmerModule { }
