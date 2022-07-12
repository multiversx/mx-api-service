import { Module } from '@nestjs/common';
import { NftQueueController } from './nft.queue.controller';
import { NftJobProcessorModule } from './job-services/nft.job.processor.module';
import { NftCronModule } from 'src/crons/nft/nft.cron.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { ApiModule } from '@elrondnetwork/erdnest';

@Module({
  imports: [
    NftJobProcessorModule,
    NftCronModule,
    NftModule,
    ApiModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
  ],
  controllers: [NftQueueController],
  exports: [],
})
export class NftQueueModule { }
