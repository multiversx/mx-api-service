import { Module } from '@nestjs/common';
import { NftQueueModule } from './nft.worker/queue/nft.queue.module';

@Module({
  imports: [
    NftQueueModule,
  ],
  controllers: [],
  providers: [],
})
export class QueueWorkerModule { }
