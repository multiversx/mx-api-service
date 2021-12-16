import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { NftWorkerService } from './nft.worker.service';
import { NftQueueModule } from './queue/nft.queue.module';

@Module({
  imports: [
    NftQueueModule,
    BullModule.registerQueue({
      name: 'nftQueue',
    }),
  ],
  providers: [NftWorkerService],
  exports: [NftWorkerService],
})
export class NftWorkerModule { }
