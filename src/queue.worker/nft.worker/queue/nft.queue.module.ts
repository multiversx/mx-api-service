import { Module } from '@nestjs/common';
import { NftQueueController } from './nft.queue.controller';
import { NftJobProcessorModule } from './job-services/nft.job.processor.module';
import { NftCronModule } from 'src/crons/nft.cron.module';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';

@Module({
  imports: [
    NftJobProcessorModule,
    NftCronModule,
    ApiConfigModule,
  ],
  controllers: [NftQueueController],
  exports: [],
})
export class NftQueueModule { }
