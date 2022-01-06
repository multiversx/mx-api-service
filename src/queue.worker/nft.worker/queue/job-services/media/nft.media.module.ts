import { Module } from '@nestjs/common';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { CachingModule } from 'src/common/caching/caching.module';
import { ApiModule } from 'src/common/network/api.module';
import { NftMediaService } from './nft.media.service';
import { PersistenceModule } from 'src/common/persistence/persistence.module';

@Module({
  imports: [
    ApiConfigModule,
    CachingModule,
    ApiModule,
    PersistenceModule,
  ],
  controllers: [],
  providers: [
    NftMediaService,
  ],
  exports: [
    NftMediaService,
  ],
})
export class NftMediaModule { }
