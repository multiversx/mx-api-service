import { CacheModule, RedisCacheModuleOptions, RedisCacheModule } from '@multiversx/sdk-nestjs-cache';
import { ElasticModule, ElasticModuleOptions } from "@multiversx/sdk-nestjs-elastic";
import { ApiModule, ApiModuleOptions } from "@multiversx/sdk-nestjs-http";
import { DynamicModule, Provider } from "@nestjs/common";
import { ClientOptions, ClientProxyFactory, Transport } from "@nestjs/microservices";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { MxnestConfigServiceImpl } from "src/common/api-config/mxnest-config-service-impl.service";
import { MXNEST_CONFIG_SERVICE } from "@multiversx/sdk-nestjs-common";

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

  static getCacheModule(): DynamicModule {
    return CacheModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) =>
        new RedisCacheModuleOptions(
          {
            host: apiConfigService.getRedisUrl(),
          },
          {
            poolLimit: apiConfigService.getPoolLimit(),
            processTtl: apiConfigService.getProcessTtl(),
          }
        ),
      inject: [ApiConfigService],
    },
      {
        skipItemsSerialization: true,
      }
    );
  }

  static getRedisCacheModule(): DynamicModule {
    return RedisCacheModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => new RedisCacheModuleOptions({
        host: apiConfigService.getRedisUrl(),
        connectTimeout: 10000,
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
      provide: MXNEST_CONFIG_SERVICE,
      useClass: MxnestConfigServiceImpl,
    };
  }

  static getPubSubService(): Provider {
    return {
      provide: 'PUBSUB_SERVICE',
      useFactory: (apiConfigService: ApiConfigService) => {
        const clientOptions: ClientOptions = {
          transport: Transport.REDIS,
          options: {
            host: apiConfigService.getRedisUrl(),
            port: 6379,
            retryDelay: 1000,
            retryAttempts: 10,
            retryStrategy: () => 1000,
          },
        };

        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ApiConfigService],
    };
  }
}
