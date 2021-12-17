import { Module } from '@nestjs/common';
import { CachingModule } from 'src/common/caching/caching.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { NftMetadataService } from './nft.metadata.service';

@Module({
  imports: [
    NftModule,
    CachingModule
  ],
  controllers: [],
  providers: [
    NftMetadataService
  ],
  exports: [
    NftMetadataService
  ]
})
export class NftMetadataModule { }
