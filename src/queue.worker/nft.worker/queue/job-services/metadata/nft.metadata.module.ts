import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CachingModule } from 'src/common/caching/caching.module';
import { DatabaseModule } from 'src/common/database/database.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { NftMetadataService } from './nft.metadata.service';

@Module({
  imports: [
    forwardRef(() => NftModule),
    CachingModule,
    TypeOrmModule.forFeature([NftMetadataModule]),
    DatabaseModule
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
