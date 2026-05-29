import { Module } from '@nestjs/common';
import { NftQueueController } from './nft.queue.controller';
import { NftJobProcessorModule } from './job-services/nft.job.processor.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { ApiMetricsModule } from 'src/common/metrics/api.metrics.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    NftJobProcessorModule,
    NftModule,
    EventEmitterModule.forRoot({ maxListeners: 1 }),
    ApiMetricsModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
  ],
  controllers: [NftQueueController],
  exports: [],
})
export class NftQueueModule { }
