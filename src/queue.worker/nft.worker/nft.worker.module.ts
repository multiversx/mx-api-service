import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { NftWorkerService } from './nft.worker.service';
import { NftMediaModule } from './queue/job-services/media/nft.media.module';
import { NftMetadataModule } from './queue/job-services/metadata/nft.metadata.module';
import { NftThumbnailModule } from './queue/job-services/thumbnails/nft.thumbnail.module';

@Module({
  imports: [
    NftMediaModule,
    NftMetadataModule,
    NftThumbnailModule,
    ApiConfigModule,
  ],
  providers: [NftWorkerService,
    {
      provide: 'QUEUE_SERVICE',
      useFactory: (configService: ApiConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [`amqp://${configService.getRabbitmqUrl()}:5672`],
            queue: 'nft_process',
            queueOptions: {
              durable: false,
            },
          },
        });
      },
      inject: [ApiConfigService],
    }],
  exports: [NftWorkerService],
})
export class NftWorkerModule { }
