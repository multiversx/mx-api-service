import { ApiUtils, OriginLogger } from "@elrondnetwork/erdnest";
import { MatchUtils, ApiService } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { NftMetadata } from "src/endpoints/nfts/entities/nft.metadata";
import { TokenHelpers } from "src/utils/token.helpers";
import { ApiConfigService } from "../../common/api-config/api.config.service";
import { NftMetadataErrorCode } from "./entities/nft.metadata.error.code";

@Injectable()
export class NftExtendedAttributesService {
  private readonly logger = new OriginLogger(NftExtendedAttributesService.name);

  constructor(
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

  async getExtendedAttributesFromMetadata(metadata: string): Promise<any> {
    const result = await this.getExtendedAttributesFromIpfs(metadata ?? '');

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

    let result: any;
    let data: any;

    try {
      result = await this.apiService.get(processedIpfsUri, { timeout: 10000 });
      data = result.data;
    } catch (error: any) {
      const status = error?.status;
      if (status === 400 && error.response) {
        return this.createError(NftMetadataErrorCode.ipfsError, `IPFS error when fetching metadata: ${error.response}`);
      } else if (status === 404) {
        return this.createError(NftMetadataErrorCode.notFound, 'Metadata file not found on IPFS');
      } else if (error.message === 'timeout of 10000ms exceeded') {
        return this.createError(NftMetadataErrorCode.timeout, 'Timeout exceeded when fetching metadata');
      }

      this.logger.error(error);
      return this.createError(NftMetadataErrorCode.unknownError, `Unknown error when fetching metadata '${metadata}'`);
    }

    const contentType = result.headers['content-type'];
    if (contentType !== 'application/json') {
      return this.createError(NftMetadataErrorCode.invalidContentType, `Invalid content type '${contentType}`);
    }

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        return this.createError(NftMetadataErrorCode.jsonParseError, 'Error when parsing as JSON');
      }
    }

    ApiUtils.cleanupApiValueRecursively(data);

    if (Object.keys(data).length === 0) {
      return this.createError(NftMetadataErrorCode.emptyMetadata, 'Metadata value is empty');
    }

    if (typeof data !== 'object' && !Array.isArray(data)) {
      return null;
    }

    return data;
  }

  private createError(code: NftMetadataErrorCode, message: string) {
    this.logger.error(message);

    return {
      error: {
        code,
        message,
        timestamp: Math.round(Date.now() / 1000),
      },
    };
  }

  getTags(attributes: string): string[] {
    const match = MatchUtils.getTagsFromBase64Attributes(attributes);
    if (!match || !match.groups) {
      return [];
    }

    return match.groups['tags'].split(',');
  }

  getMetadataFromBase64EncodedAttributes(attributes: string): string | undefined {
    const match = MatchUtils.getMetadataFromBase64Attributes(attributes);
    if (!match || !match.groups) {
      return undefined;
    }

    return match.groups['metadata'];
  }
}
