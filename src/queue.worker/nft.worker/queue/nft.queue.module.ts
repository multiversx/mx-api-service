import { Module } from '@nestjs/common';
import { NftQueueController } from './nft.queue.controller';
import { NftJobProcessorModule } from './job-services/nft.job.processor.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';

@Module({
  imports: [
    NftJobProcessorModule,
    NftModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
  ],
  controllers: [NftQueueController],
  exports: [],
})
export class NftQueueModule { }
