import { Module } from '@nestjs/common';
import { NftMediaModule } from './media/nft.media.module';
import { NftMetadataModule } from './metadata/nft.metadata.module';
import { NftThumbnailModule } from './thumbnails/nft.thumbnail.module';

@Module({
  imports: [
    NftMediaModule,
    NftMetadataModule,
    NftThumbnailModule,
  ],
  exports: [
    NftMediaModule,
    NftMetadataModule,
    NftThumbnailModule,
  ],
})
export class NftJobProcessorModule { }
