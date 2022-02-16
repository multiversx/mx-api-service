import { Inject, Injectable, Logger } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { PersistenceInterface } from "src/common/persistence/persistence.interface";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftExtendedAttributesService } from "src/endpoints/nfts/nft.extendedattributes.service";


@Injectable()
export class NftMetadataService {
  private readonly logger: Logger;

  constructor(
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    @Inject('PersistenceService')
    private readonly persistenceService: PersistenceInterface,
    private readonly cachingService: CachingService,
  ) {
    this.logger = new Logger(NftMetadataService.name);
  }

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
    return await this.cachingService.getOrSetCache(
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

    await this.persistenceService.deleteMetadata(nft.identifier);
    await this.persistenceService.setMetadata(nft.identifier, metadataRaw);

    await this.cachingService.deleteInCache(CacheInfo.NftMetadata(nft.identifier).key);
    await this.cachingService.setCache(
      CacheInfo.NftMetadata(nft.identifier).key,
      metadataRaw,
      CacheInfo.NftMetadata(nft.identifier).ttl
    );

    return metadataRaw;
  }

  async getMetadataRaw(nft: Nft): Promise<any> {
    if (!nft.attributes || nft.type === NftType.MetaESDT) {
      return null;
    }

    try {
      this.logger.log(`Started fetching metadata for nft with identifier '${nft.identifier}'`);
      const nftMetadata = await this.nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes(nft.attributes);
      this.logger.log(`Completed fetching metadata for nft with identifier '${nft.identifier}'`);
      return nftMetadata ?? null;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when fetching metadata for nft with identifier '${nft.identifier}'`);
      throw error;
    }
  }
}
