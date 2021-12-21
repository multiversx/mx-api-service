import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { CachingModule } from 'src/common/caching/caching.module';
import { NftWorkerService } from './nft.worker.service';
import { NftThumbnailModule } from './queue/job-services/thumbnails/nft.thumbnail.module';
import { NftQueueModule } from './queue/nft.queue.module';

@Module({
  imports: [
    NftQueueModule,
    BullModule.registerQueue({
      name: 'nftQueue',
    }),
    NftThumbnailModule,
    CachingModule,
  ],
  providers: [NftWorkerService],
  exports: [NftWorkerService],
})
export class NftWorkerModule { }
