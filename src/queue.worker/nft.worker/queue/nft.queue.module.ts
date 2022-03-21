import { Module } from '@nestjs/common';
import { NftQueueController } from './nft.queue.controller';
import { NftJobProcessorModule } from './job-services/nft.job.processor.module';
import { NftCronModule } from 'src/crons/nft/nft.cron.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { ClientOptions, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    NftJobProcessorModule,
    NftCronModule,
    NftModule,
  ],
  providers: [
    {
      provide: 'PUBSUB_SERVICE',
      useFactory: (apiConfigService: ApiConfigService) => {
        const clientOptions: ClientOptions = {
          transport: Transport.REDIS,
          options: {
            url: `redis://${apiConfigService.getRedisUrl()}:6379`,
            retryDelay: 1000,
            retryAttempts: 10,
            retry_strategy: function (_: any) {
              return 1000;
            },
          },
        };

        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ApiConfigService],
    },
  ],
  controllers: [NftQueueController],
  exports: [],
})
export class NftQueueModule { }
