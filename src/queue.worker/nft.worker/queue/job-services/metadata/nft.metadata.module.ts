import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { NftMetadataDb } from './entities/nft.metadata.db';
import { NftMetadataService } from './nft.metadata.service';

@Module({
  imports: [
    forwardRef(() => NftModule),
    TypeOrmModule.forFeature([NftMetadataDb]),
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
