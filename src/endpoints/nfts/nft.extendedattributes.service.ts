import { OriginLogger } from "@elrondnetwork/erdnest";
import { Constants, MatchUtils, CachingService, ApiService } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { NftMetadata } from "src/endpoints/nfts/entities/nft.metadata";
import { TokenHelpers } from "src/utils/token.helpers";
import { ApiConfigService } from "../../common/api-config/api.config.service";

@Injectable()
export class NftExtendedAttributesService {
  private readonly logger = new OriginLogger(NftExtendedAttributesService.name);

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) { }

  async tryGetExtendedAttributesFromBase64EncodedAttributes(attributes: string): Promise<any> {
    try {
      return await this.getExtendedAttributesFromBase64EncodedAttributes(attributes);
    } catch (error) {
      this.logger.error(`Could not get extended attributes from raw attributes '${attributes}'`);
      this.logger.error(error);
      return undefined;
    }
  }

  async getExtendedAttributesFromBase64EncodedAttributes(attributes: string): Promise<NftMetadata | undefined> {
    const metadata = this.getMetadataFromBase64EncodedAttributes(attributes);
    if (metadata === undefined) {
      return undefined;
    }

    return await this.getExtendedAttributesFromMetadata(metadata);
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

  async getExtendedAttributesFromMetadata(metadata: string): Promise<any> {
    const result = await this.cachingService.getOrSetCache<NftMetadata>(
      `nftExtendedAttributes:${metadata}`,
      async () => await this.getExtendedAttributesFromIpfs(metadata ?? ''),
      Constants.oneWeek(),
      Constants.oneDay()
    );

    if (!result) {
      return undefined;
    }

    if (Object.keys(result).length === 0) {
      return undefined;
    }

    if (result.fileUri) {
      result.fileUri = TokenHelpers.computeNftUri(result.fileUri, this.apiConfigService.getExternalMediaUrl() + '/nfts/asset');
    }

    return result;
  }

  private async getExtendedAttributesFromIpfs(metadata: string): Promise<any> {
    const ipfsUri = `https://ipfs.io/ipfs/${metadata}`;
    const processedIpfsUri = TokenHelpers.computeNftUri(ipfsUri, this.apiConfigService.getMediaUrl() + '/nfts/asset');

    const result = await this.apiService.get(processedIpfsUri, { timeout: 5000 });

    const data = result.data;

    if (typeof data !== 'object' && !Array.isArray(data)) {
      return null;
    }

    return data;
  }

  getTags(attributes: string): string[] {
    const match = MatchUtils.getTagsFromBase64Attributes(attributes);
    if (!match || !match.groups) {
      return [];
    }

    return match.groups['tags'].split(',');
  }

  private getMetadataFromBase64EncodedAttributes(attributes: string): string | undefined {
    const match = MatchUtils.getMetadataFromBase64Attributes(attributes);
    if (!match || !match.groups) {
      return undefined;
    }

    return match.groups['metadata'];
  }
}
