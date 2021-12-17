import { Module } from '@nestjs/common';
import { NftWorkerModule } from './nft.worker/nft.worker.module';

@Module({
  imports: [
    NftWorkerModule,
  ],
  controllers: [],
  providers: [],
})
export class QueueWorkerModule { }
