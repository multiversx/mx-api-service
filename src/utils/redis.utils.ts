import { RedisOptions, Transport } from "@nestjs/microservices";
import { ApiConfigService } from '../common/api-config/api.config.service';

export class RedisUtils {

  static getRedisConnectionOptions(apiConfigService: ApiConfigService) {
    return {
      host: apiConfigService.getRedisUrl(),
      port: 6379,
      retryDelay: 1000,
      retryAttempts: 10,
      retryStrategy: () => 1000,
    };
  }
  static getMicroserviceConnectionOptions(apiConfigService: ApiConfigService): RedisOptions {
    return {
      transport: Transport.REDIS,
      options: RedisUtils.getRedisConnectionOptions(apiConfigService),
    };
  }
}
