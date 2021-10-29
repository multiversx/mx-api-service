import { Injectable, Logger } from "@nestjs/common";
import { ApiService } from "src/common/network/api.service";
import { NftMetadata } from "src/endpoints/nfts/entities/nft.metadata";
import { BinaryUtils } from "src/utils/binary.utils";
import { Constants } from "src/utils/constants";
import { TokenUtils } from "src/utils/tokens.utils";
import { ApiConfigService } from "../../common/api-config/api.config.service";
import { CachingService } from "../../common/caching/caching.service";

@Injectable()
export class NftExtendedAttributesService {
  private readonly logger: Logger;

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) {
    this.logger = new Logger(NftExtendedAttributesService.name);
  }

  async tryGetExtendedAttributesFromBase64EncodedAttributes(attributes: string): Promise<NftMetadata | undefined> {
    try {
      return await this.getExtendedAttributesFromBase64EncodedAttributes(attributes);
    } catch (error) {
      this.logger.error(`Could not get extended attributes from raw attributes '${attributes}'`);
      this.logger.error(error);
      return undefined;
    }
  }

  async getExtendedAttributesFromBase64EncodedAttributes(attributes: string): Promise<NftMetadata | undefined> {
    let metadata = this.getMetadataFromBase64EncodedAttributes(attributes);
    if (metadata === undefined) {
      return undefined;
    }

    return this.getExtendedAttributesFromMetadata(metadata);
  }

  async tryGetExtendedAttributesFromMetadata(metadata: string): Promise<NftMetadata | undefined> {
    try {
      return await this.getExtendedAttributesFromMetadata(metadata);
    } catch (error) {
      this.logger.error(`Error when getting extended attributes from metadata '${metadata}'`);
      this.logger.error(error);
      return undefined;
    }
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
        result.fileUri = TokenUtils.computeNftUri(result.fileUri, this.apiConfigService.getExternalMediaUrl() + '/nfts/asset');
      }

      return result;
    }

    return undefined;
  }

  private async getExtendedAttributesFromIpfs(metadata: string): Promise<NftMetadata> {
    let ipfsUri = `https://ipfs.io/ipfs/${metadata}`;
    let processedIpfsUri = TokenUtils.computeNftUri(ipfsUri, this.apiConfigService.getMediaUrl() + '/nfts/asset');

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

  private getMetadataFromBase64EncodedAttributes(attributes: string): string | undefined {
    let decodedAttributes = BinaryUtils.base64Decode(attributes);
    let match = decodedAttributes.match(/metadata:(?<metadata>[\w]*)/);
    if (!match || !match.groups) {
      return undefined;
    }

    return match.groups['metadata'];
  }
}