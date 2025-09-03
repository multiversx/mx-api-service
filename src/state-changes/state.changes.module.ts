import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { StateChangesConsumerService } from './state.changes.consumer.service';
import { MongoDbModule } from 'src/common/indexer/db';

@Module({
    imports: [
        ApiConfigModule,
        MongoDbModule,
        DynamicModuleUtils.getCacheModule(),
    ],
    providers: [
        StateChangesConsumerService,
        DynamicModuleUtils.getPubSubService(),
    ],
})
export class StateChangesModule {
    static register(): DynamicModule {
        return {
            module: StateChangesModule,
            imports: [
                RabbitMQModule.forRootAsync(RabbitMQModule, {
                    imports: [ApiConfigModule],
                    inject: [ApiConfigService],
                    useFactory: (apiConfigService: ApiConfigService) => {
                        return {
                            name: apiConfigService.getStateChangesExchange(),
                            type: 'fanout',
                            options: {},
                            uri: apiConfigService.getStateChangesUrl(),
                        };
                    },
                }),
            ],
        };
    }
}
