import { forwardRef, Module } from '@nestjs/common';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { NftMetadataService } from './nft.metadata.service';

@Module({
  imports: [
    forwardRef(() => NftModule),
  ],
  controllers: [],
  providers: [
    NftMetadataService,
  ],
  exports: [
    NftMetadataService,
  ],
})
export class NftMetadataModule { }
