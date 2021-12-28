import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CachingModule } from 'src/common/caching/caching.module';
import { DatabaseModule } from 'src/common/database/database.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { NftMetadataDb } from './entities/nft.metadata.db';
import { NftMetadataService } from './nft.metadata.service';

@Module({
  imports: [
    forwardRef(() => NftModule),
    DatabaseModule,
    TypeOrmModule.forFeature([NftMetadataDb]),
    CachingModule,
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
