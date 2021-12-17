import { Module } from '@nestjs/common';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { CachingModule } from 'src/common/caching/caching.module';
import { ApiModule } from 'src/common/network/api.module';
import { NftMediaService } from './nft.media.service';

@Module({
  imports: [
    ApiConfigModule,
    CachingModule,
    ApiModule,
  ],
  controllers: [],
  providers: [
    NftMediaService
  ],
  exports: [
    NftMediaService
  ]
})
export class NftMediaModule { }
