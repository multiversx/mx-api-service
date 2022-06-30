import { ApiModule, CachingModule, ElasticModule, ApiModuleOptions, ElasticModuleOptions, CachingModuleOptions, ERDNEST_CONFIG_SERVICE } from "@elrondnetwork/erdnest";
import { DynamicModule, Provider } from "@nestjs/common";
import { ClientOptions, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ErdnestConfigServiceImpl } from "src/common/api-config/erdnest.config.service.impl";

export class DynamicModuleUtils {
  static getElasticModule(): DynamicModule {
    return ElasticModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => new ElasticModuleOptions({
        url: apiConfigService.getElasticUrl(),
        customValuePrefix: 'api',
      }),
      inject: [ApiConfigService],
    });
  }

  static getCachingModule(): DynamicModule {
    return CachingModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => new CachingModuleOptions({
        url: apiConfigService.getRedisUrl(),
        poolLimit: apiConfigService.getPoolLimit(),
        processTtl: apiConfigService.getProcessTtl(),
      }),
      inject: [ApiConfigService],
    });
  }

  static getApiModule(): DynamicModule {
    return ApiModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => new ApiModuleOptions({
        axiosTimeout: apiConfigService.getAxiosTimeout(),
        rateLimiterSecret: apiConfigService.getRateLimiterSecret(),
        serverTimeout: apiConfigService.getServerTimeout(),
        useKeepAliveAgent: apiConfigService.getUseKeepAliveAgentFlag(),
      }),
      inject: [ApiConfigService],
    });
  }

  static getNestJsApiConfigService(): Provider {
    return {
      provide: ERDNEST_CONFIG_SERVICE,
      useClass: ErdnestConfigServiceImpl,
    };
  }

  static getPubSubService(): Provider {
    return {
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
    };
  }
}
