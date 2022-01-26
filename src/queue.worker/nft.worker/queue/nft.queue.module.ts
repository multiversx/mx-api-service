import { Module } from '@nestjs/common';
import { NftQueueController } from './nft.queue.controller';
import { NftJobProcessorModule } from './job-services/nft.job.processor.module';
import { NftCronModule } from 'src/crons/nft.cron.module';

@Module({
  imports: [
    NftJobProcessorModule,
    NftCronModule,
  ],
  controllers: [NftQueueController],
  exports: [],
})
export class NftQueueModule { }
