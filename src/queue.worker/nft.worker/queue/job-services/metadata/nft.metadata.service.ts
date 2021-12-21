import { Injectable, Logger } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
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

  async fetchMetadata(nft: Nft) {
    if (!nft.attributes) {
      return;
    }

    this.logger.log(`Started fetching metadata for nft with identifier '${nft.identifier}'`);

    let nftMetadata: NftMetadata | undefined;
    try {
      nftMetadata = await this.nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes(nft.attributes);
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when fetching metadata for nft with identifier '${nft.identifier}'`);
      return;
    }

    await this.cachingService.setCache(
      `nftMetadata:${nft.identifier}`,
      nftMetadata ?? null,
      Constants.oneMonth() * 12,
    );

    this.logger.log(`Completed fetching metadata for nft with identifier '${nft.identifier}'`);

    nft.metadata = nftMetadata;
  }
}