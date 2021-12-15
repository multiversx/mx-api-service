import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { CommonModule } from 'src/common/common.module';
import { NftThumbnailQueueService } from './nft.thumbnail.queue.service';

@Module({
  imports: [
    CommonModule,
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
      name: 'nftThumbnails',
    }),
  ],
  controllers: [],
  providers: [
    NftThumbnailQueueService,
  ],
})
export class NftThumbnailQueueModule { }
