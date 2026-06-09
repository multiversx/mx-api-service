import { Module } from '@nestjs/common';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { NftMediaService } from './nft.media.service';

@Module({
  imports: [
  ],
  controllers: [],
  providers: [
    NftMediaService,
    DynamicModuleUtils.getPubSubService(),
  ],
  exports: [
    NftMediaService,
  ],
})
export class NftMediaModule { }
