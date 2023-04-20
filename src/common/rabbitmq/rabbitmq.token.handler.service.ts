import { Inject, Injectable } from '@nestjs/common';
import { CacheInfo } from '../../utils/cache.info';
import { NotifierEvent } from './entities/notifier.event';
import { EsdtService } from 'src/endpoints/esdt/esdt.service';
import { ClientProxy } from '@nestjs/microservices';
import { BinaryUtils, OriginLogger } from '@multiversx/sdk-nestjs-common';
import { CacheService } from "@multiversx/sdk-nestjs-cache";

@Injectable()
export class RabbitMqTokenHandlerService {
  private readonly logger = new OriginLogger(RabbitMqTokenHandlerService.name);

  constructor(
    private readonly cachingService: CacheService,
    private readonly esdtService: EsdtService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  public async handleTransferOwnershipEvent(event: NotifierEvent): Promise<boolean> {
    const tokenIdentifier = BinaryUtils.base64Decode(event.topics[0]);

    try {
      const esdtProperties = await this.esdtService.getEsdtTokenPropertiesRaw(tokenIdentifier);
      if (!esdtProperties) {
        return false;
      }

      await this.invalidateKey(
        CacheInfo.EsdtProperties(tokenIdentifier).key,
        esdtProperties,
        CacheInfo.EsdtProperties(tokenIdentifier).ttl
      );

      return true;
    } catch (error) {
      this.logger.error(`An unhandled error occurred when processing transferOwnership event for token with identifier '${tokenIdentifier}'`);
      this.logger.error(error);

      return false;
    }
  }

  private async invalidateKey(key: string, data: any, ttl: number) {
    await this.cachingService.set(key, data, ttl);
    this.refreshCacheKey(key, ttl);
  }

  private refreshCacheKey(key: string, ttl: number) {
    this.clientProxy.emit('refreshCacheKey', { key, ttl });
  }
}
