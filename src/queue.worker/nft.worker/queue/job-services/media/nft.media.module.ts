import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { CachingModule } from 'src/common/caching/caching.module';
import { DatabaseModule } from 'src/common/database/database.module';
import { ApiModule } from 'src/common/network/api.module';
import { NftMediaDb } from './entities/nft.media.db';
import { NftMediaService } from './nft.media.service';

@Module({
  imports: [
    ApiConfigModule,
    CachingModule,
    ApiModule,
    DatabaseModule,
    TypeOrmModule.forFeature([NftMediaDb]),
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
