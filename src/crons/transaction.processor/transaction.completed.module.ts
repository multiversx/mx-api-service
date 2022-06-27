import { CachingModule } from '@elrondnetwork/nestjs-microservice-common';
import { Module } from '@nestjs/common';
import { ClientOptions, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { TransactionCompletedService } from './transaction.completed.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ApiConfigModule,
    CachingModule,
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
    TransactionCompletedService,
  ],
})
export class TransactionCompletedModule { }
