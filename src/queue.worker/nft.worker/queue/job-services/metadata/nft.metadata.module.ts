import { forwardRef, Module } from '@nestjs/common';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { NftMetadataService } from './nft.metadata.service';

@Module({
  imports: [
    forwardRef(() => NftModule),
  ],
  controllers: [],
  providers: [
    NftMetadataService,
    DynamicModuleUtils.getPubSubService(),
  ],
  exports: [
    NftMetadataService,
  ],
})
export class NftMetadataModule { }
