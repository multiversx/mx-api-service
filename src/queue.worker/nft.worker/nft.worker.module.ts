import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { NftWorkerService } from './nft.worker.service';
import { NftAssetModule } from './queue/job-services/assets/nft.asset.module';
import { NftMediaModule } from './queue/job-services/media/nft.media.module';
import { NftMetadataModule } from './queue/job-services/metadata/nft.metadata.module';
import { NftThumbnailModule } from './queue/job-services/thumbnails/nft.thumbnail.module';

@Module({
  imports: [
    NftMediaModule,
    NftMetadataModule,
    NftThumbnailModule,
    NftAssetModule,
    PersistenceModule.forRoot(),
  ],
  providers: [
    NftWorkerService,
    {
      provide: 'QUEUE_SERVICE',
      useFactory: (configService: ApiConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getRabbitmqUrl()],
            queue: configService.getNftQueueName(),
            prefetchCount: configService.getNftProcessParallelism(),
            queueOptions: {
              durable: true,
              // arguments: {
              //   'x-single-active-consumer': true,
              // },
              deadLetterExchange: configService.getNftQueueDlqName(),
            },
          },
        });
      },
      inject: [ApiConfigService],
    }],
  exports: [NftWorkerService],
})
export class NftWorkerModule { }
