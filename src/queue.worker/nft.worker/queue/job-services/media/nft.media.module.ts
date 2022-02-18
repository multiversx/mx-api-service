import { Module } from '@nestjs/common';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { NftMediaService } from './nft.media.service';

@Module({
  imports: [
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
