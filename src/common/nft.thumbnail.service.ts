import { Injectable } from "@nestjs/common";
import { Nft } from "src/endpoints/tokens/entities/nft";
import { Constants } from "src/utils/constants";
import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";
import { CachingService } from "./caching.service";

@Injectable()
export class NftThumbnailService {

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {}

  async updateThumbnailUrlForNfts(nfts: Nft[]) {
    let mediaNfts = nfts.filter(nft => nft.uris.filter(uri => uri).length > 0);

    let customThumbnailConfirmations = await this.cachingService.batchProcess(
      mediaNfts,
      nft => `nftCustomThumbnail:${nft.identifier}`,
      async (nft) => await this.hasCustomThumbnail(nft.identifier),
      Constants.oneWeek()
    );

    let standardThumbnailConfirmations = await this.cachingService.batchProcess(
      mediaNfts,
      nft => `nftStandardThumbnail:${nft.identifier}`,
      async (nft) => await this.hasStandardThumbnail(nft.identifier),
      Constants.oneWeek()
    );

    for (let [index, nft] of mediaNfts.entries()) {
      let isCustomThumbnail = customThumbnailConfirmations[index];
      let isStandardThumbnail = standardThumbnailConfirmations[index];

      if (isCustomThumbnail === true) {
        nft.thumbnailUrl = `${this.apiConfigService.getMediaUrl()}/nfts/thumbnail/custom/${nft.identifier}`;
      } else if (isStandardThumbnail === true) {
        nft.thumbnailUrl = `${this.apiConfigService.getMediaUrl()}/nfts/thumbnail/standard/${nft.identifier}`;
      } else if (nft.metadata && nft.metadata.fileType) {
        nft.thumbnailUrl = `${this.apiConfigService.getMediaUrl()}/nfts/thumbnail/default/${nft.metadata.fileType.replace('/', '-')}`;
      } else {
        nft.thumbnailUrl = `${this.apiConfigService.getMediaUrl()}/nfts/thumbnail/default/default`;
      }
    }
  }

  private async hasCustomThumbnail(nftIdentifier: string): Promise<boolean> {
    try {
      const { status } = await this.apiService.head(`${this.apiConfigService.getNftThumbnailsUrl()}/custom/${nftIdentifier}`);

      return status === 200;
    } catch (error) {
      return false;
    }
  }

  private async hasStandardThumbnail(nftIdentifier: string): Promise<boolean> {
    try {
      const { status } = await this.apiService.head(`${this.apiConfigService.getNftThumbnailsUrl()}/standard/${nftIdentifier}`);

      return status === 200;
    } catch (error) {
      return false;
    }
  }
}