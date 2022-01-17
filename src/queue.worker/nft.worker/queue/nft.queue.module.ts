import { Module } from '@nestjs/common';
import { NftQueueController } from './nft.queue.controller';
import { NftJobProcessorModule } from './job-services/nft.job.processor.module';

@Module({
  imports: [
    NftJobProcessorModule,
  ],
  controllers: [NftQueueController],
  exports: [],
})
export class NftQueueModule { }
