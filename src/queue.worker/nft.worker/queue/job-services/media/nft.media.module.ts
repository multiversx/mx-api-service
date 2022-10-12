import { Module } from '@nestjs/common';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { NftMediaService } from './nft.media.service';

@Module({
  imports: [
    PersistenceModule.register(),
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
