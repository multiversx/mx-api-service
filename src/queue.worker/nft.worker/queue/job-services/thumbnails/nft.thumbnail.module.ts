import { Module } from '@nestjs/common';
import { AWSService } from './aws.service';
import { NftThumbnailService } from './nft.thumbnail.service';

@Module({
  controllers: [],
  providers: [
    NftThumbnailService, AWSService,
  ],
  exports: [
    NftThumbnailService,
  ],
})
export class NftThumbnailModule { }
