import { Module } from '@nestjs/common';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { ApiModule } from 'src/common/network/api.module';
import { AWSService } from './aws.service';
import { NftThumbnailService } from './nft.thumbnail.service';

@Module({
  imports: [
    ApiConfigModule,
    ApiModule,
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
