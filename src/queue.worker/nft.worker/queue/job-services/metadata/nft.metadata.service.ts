import { Injectable, Logger } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftMetadata } from "src/endpoints/nfts/entities/nft.metadata";
import { NftExtendedAttributesService } from "src/endpoints/nfts/nft.extendedattributes.service";
import { Constants } from "src/utils/constants";


@Injectable()
export class NftMetadataService {
  private readonly logger: Logger;

  constructor(
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
    private readonly cachingService: CachingService,
  ) {
    this.logger = new Logger(NftMetadataService.name);
  }

  async fetchMetadata(nft: Nft, forceRefresh: boolean = false) {
    let metadata = await this.cachingService.getOrSetCache(
      CacheInfo.NftMetadata(nft.identifier).key,
      async () => await this.fetchMetadataRaw(nft),
      CacheInfo.NftMetadata(nft.identifier).ttl,
      Constants.oneDay(),
      forceRefresh
    );
    
    if (!metadata) {
      return;
    }

    nft.metadata = metadata;
  }

  async fetchMetadataRaw(nft: Nft): Promise<NftMetadata | null> {
    if (!nft.attributes) {
      return null;
    }

    try {
      this.logger.log(`Started fetching metadata for nft with identifier '${nft.identifier}'`);
      let nftMetadata = await this.nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes(nft.attributes);
      this.logger.log(`Completed fetching metadata for nft with identifier '${nft.identifier}'`);
      return nftMetadata ?? null;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when fetching metadata for nft with identifier '${nft.identifier}'`);
      throw error;
    }
  }
}