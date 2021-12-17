import { Injectable, Logger } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { Nft } from "src/endpoints/nfts/entities/nft";
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
    if (nft.attributes) {
      try {
        this.logger.log(`Started fetching metadata for nft with identifier '${nft.identifier}'`);

        let nftMetadata = await this.nftExtendedAttributesService.tryGetExtendedAttributesFromBase64EncodedAttributes(nft.attributes);
        await this.cachingService.setCache(
          `nftMetadata:${nft.identifier}`,
          nftMetadata,
          Constants.oneWeek(),
        );

        this.logger.log(`Completed fetching metadata for nft with identifier '${nft.identifier}'`);

        nft.metadata = nftMetadata;
      } catch (error) {
        this.logger.error(error);
        this.logger.error(`Error when getting metadata for nft with identifier '${nft.identifier}'`);
      }
    }
  }
}