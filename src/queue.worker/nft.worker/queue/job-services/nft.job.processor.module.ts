import { Module } from '@nestjs/common';
import { NftAssetModule } from './assets/nft.asset.module';
import { NftMediaModule } from './media/nft.media.module';
import { NftMetadataModule } from './metadata/nft.metadata.module';
import { NftThumbnailModule } from './thumbnails/nft.thumbnail.module';

@Module({
  imports: [
    NftMediaModule,
    NftMetadataModule,
    NftThumbnailModule,
    NftAssetModule,
  ],
  exports: [
    NftMediaModule,
    NftMetadataModule,
    NftThumbnailModule,
    NftAssetModule,
  ],
})
export class NftJobProcessorModule { }
