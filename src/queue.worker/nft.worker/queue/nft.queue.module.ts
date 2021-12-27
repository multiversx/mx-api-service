import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { NftQueueService } from './nft.queue.service';
import { NftJobProcessorModule } from './job-services/nft.job.processor.module';

@Module({
  imports: [
    NftJobProcessorModule,
    BullModule.forRootAsync({
      useFactory: async (apiConfigService: ApiConfigService) => ({
        redis: {
          host: apiConfigService.getRedisUrl(),
          port: 6379,
        },
      }),
      imports: [ApiConfigModule],
      inject: [ApiConfigService],
    }),
    BullModule.registerQueue({
      name: 'nftQueue',
    }),
  ],
  controllers: [],
  providers: [
    NftQueueService,
  ],
})
export class NftQueueModule { }
