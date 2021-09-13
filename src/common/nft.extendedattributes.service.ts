import { Injectable } from "@nestjs/common";
import { NftMetadata } from "src/endpoints/tokens/entities/nft.metadata";
import { BinaryUtils } from "src/utils/binary.utils";
import { Constants } from "src/utils/constants";
import { TokenUtils } from "src/utils/tokens.utils";
import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";
import { CachingService } from "./caching.service";

@Injectable()
export class NftExtendedAttributesService {
  private readonly NFT_THUMBNAIL_PREFIX: string;

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.NFT_THUMBNAIL_PREFIX = this.apiConfigService.getMediaUrl() + '/nfts/asset';
  }

  async getExtendedAttributesFromRawAttributes(attributes: string): Promise<NftMetadata | undefined> {
    let metadata = this.getMetadata(attributes);
    if (metadata === undefined) {
      return undefined;
    }

    return this.getExtendedAttributesFromMetadata(metadata);
  }

  async getExtendedAttributesFromMetadata(metadata: string): Promise<NftMetadata | undefined> {
    let result = await this.cachingService.getOrSetCache<NftMetadata>(
      `nftExtendedAttributes:${metadata}`,
      async () => await this.getExtendedAttributesFromIpfs(metadata ?? ''),
      Constants.oneWeek(),
      Constants.oneDay()
    );

    if (Object.keys(result).length > 0) {
      if (result.fileUri) {
        result.fileUri = TokenUtils.computeNftUri(result.fileUri, this.NFT_THUMBNAIL_PREFIX);
      }

      return result;
    }

    return undefined;
  }

  private async getExtendedAttributesFromIpfs(metadata: string): Promise<NftMetadata> {
    let ipfsUri = `https://ipfs.io/ipfs/${metadata}`;
    let processedIpfsUri = TokenUtils.computeNftUri(ipfsUri, this.NFT_THUMBNAIL_PREFIX);

    let result = await this.apiService.get(processedIpfsUri, 5000);
    return result.data;
  }

  getTags(attributes: string): string[] {
    let decodedAttributes = BinaryUtils.base64Decode(attributes);
    let match = decodedAttributes.match(/tags:(?<tags>[\w\s\,]*)/);
    if (!match || !match.groups) {
      return [];
    }

    return match.groups['tags'].split(',');
  }

  private getMetadata(attributes: string): string | undefined {
    let decodedAttributes = BinaryUtils.base64Decode(attributes);
    let match = decodedAttributes.match(/metadata:(?<metadata>[\w]*)/);
    if (!match || !match.groups) {
      return undefined;
    }

    return match.groups['metadata'];
  }
}