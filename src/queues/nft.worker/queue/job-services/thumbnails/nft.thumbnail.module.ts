import { Module } from '@nestjs/common';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { AWSService } from './aws.service';
import { NftThumbnailService } from './nft.thumbnail.service';

@Module({
  imports: [
    ApiConfigModule,
  ],
  controllers: [],
  providers: [
    NftThumbnailService, AWSService
  ],
  exports: [
    NftThumbnailService
  ]
})
export class NftThumbnailModule { }
