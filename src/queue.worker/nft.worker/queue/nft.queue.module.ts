import { Module } from '@nestjs/common';
import { NftQueueController } from './nft.queue.controller';
import { NftJobProcessorModule } from './job-services/nft.job.processor.module';
import { ProcessingTriggerModule } from 'src/crons/processing.trigger.module';

@Module({
  imports: [
    NftJobProcessorModule,
    ProcessingTriggerModule,
  ],
  controllers: [NftQueueController],
  exports: [],
})
export class NftQueueModule { }
