import { Module } from '@nestjs/common';
import { NftThumbnailQueueModule } from './nft.thumbnail/nft.thumbnail.queue.module';

@Module({
  imports: [
    NftThumbnailQueueModule,
  ],
  controllers: [],
  providers: [],
})
export class QueueWorkerModule { }
