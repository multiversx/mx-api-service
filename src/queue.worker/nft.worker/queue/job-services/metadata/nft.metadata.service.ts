import { ElrondCachingService } from "@multiversx/sdk-nestjs";
import { Inject, Injectable } from "@nestjs/common";
import { CacheInfo } from "src/utils/cache.info";
import { PersistenceService } from "src/common/persistence/persistence.service";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftExtendedAttributesService } from "src/endpoints/nfts/nft.extendedattributes.service";
import { ClientProxy } from "@nestjs/microservices";
import { OriginLogger } from "@multiversx/sdk-nestjs";
import { CachingUtils } from "src/utils/caching.utils";


@Injectable()
export class NftMetadataService {
  private readonly logger = new OriginLogger(NftMetadataService.name);

  constructor(
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    private readonly persistenceService: PersistenceService,
    private readonly cachingService: ElrondCachingService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  async getOrRefreshMetadata(nft: Nft): Promise<any> {
    if (!nft.attributes || nft.type === NftType.MetaESDT) {
      return undefined;
    }

    const metadata = await this.getMetadata(nft);
    if (!metadata) {
      return await this.refreshMetadata(nft);
    }

    return metadata;
  }

  async getMetadata(nft: Nft): Promise<any> {
    return await this.cachingService.getOrSet(
      CacheInfo.NftMetadata(nft.identifier).key,
      async () => await this.persistenceService.getMetadata(nft.identifier),
      CacheInfo.NftMetadata(nft.identifier).ttl
    );
  }

  async refreshMetadata(nft: Nft): Promise<any> {
    let metadataRaw = await this.getMetadataRaw(nft);
    if (!metadataRaw) {
      metadataRaw = {};
    }

    await this.persistenceService.setMetadata(nft.identifier, metadataRaw);

    await this.cachingService.set(
      CacheInfo.NftMetadata(nft.identifier).key,
      metadataRaw,
      CacheInfo.NftMetadata(nft.identifier).ttl
    );

    await this.clientProxy.emit('refreshCacheKey', {
      key: CacheInfo.NftMetadata(nft.identifier).key,
      ttl: CacheInfo.NftMetadata(nft.identifier).ttl,
    });

    return metadataRaw;
  }

  async getMetadataRaw(nft: Nft): Promise<any> {
    if (!nft.attributes || nft.type === NftType.MetaESDT) {
      return null;
    }

    try {
      const nftMetadata = await CachingUtils.executeOptimistic({
        cachingService: this.cachingService,
        description: `Fetching metadata for nft with identifier '${nft.identifier}' and attributes '${nft.attributes}'`,
        key: CacheInfo.PendingMetadataGet(nft.identifier).key,
        ttl: CacheInfo.PendingMetadataGet(nft.identifier).ttl,
        action: async () => await this.nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes(nft.attributes),
      });

      return nftMetadata ?? null;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when fetching metadata for nft with identifier '${nft.identifier}'`);
      throw error;
    }
  }
}
