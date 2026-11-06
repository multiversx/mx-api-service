import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Constants } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { CacheInfo } from "src/utils/cache.info";
import { CachingUtils } from "src/utils/caching.utils";
import { isSafePublicUrl, publicHttpsAgent } from "src/utils/ip.utils";
import { TokenHelpers } from "src/utils/token.helpers";
import { AWSService } from "../thumbnails/aws.service";
import { NftMediaService } from "../media/nft.media.service";

@Injectable()
export class NftAssetService {
  private readonly logger = new OriginLogger(NftAssetService.name);
  private readonly API_TIMEOUT_MILLISECONDS = Constants.oneSecond() * 30 * 1000;
  private readonly STANDARD_PATH: string = 'nfts/asset';

  constructor(
    private readonly apiService: ApiService,
    private readonly awsService: AWSService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CacheService,
  ) { }

  async uploadAsset(identifier: string, fileUrl: string, fileType: string) {
    const cacheIdentifier = `${identifier}-${TokenHelpers.getUrlHash(fileUrl)}`;

    try {
      const mediaUrl = TokenHelpers.computeNftUri(fileUrl, this.apiConfigService.getMediaUrl() + '/nfts/asset');
      if (!await isSafePublicUrl(mediaUrl)) {
        this.logger.warn(`Refused uploading asset for NFT with identifier '${identifier}' from non-public url '${mediaUrl}'`);
        return;
      }

      const fileResult: any = await CachingUtils.executeOptimistic({
        cachingService: this.cachingService,
        description: `Uploading assets to S3 for NFT with identifier '${identifier}', file url '${fileUrl}'`,
        key: CacheInfo.PendingUploadAsset(cacheIdentifier).key,
        ttl: CacheInfo.PendingUploadAsset(cacheIdentifier).ttl,
        action: async () => await this.apiService.get(mediaUrl, { responseType: 'arraybuffer', timeout: this.API_TIMEOUT_MILLISECONDS, skipRedirects: true, httpsAgent: publicHttpsAgent, maxContentLength: NftMediaService.MAX_FILE_SIZE }),
      });

      const file = fileResult.data;

      const fileName = TokenHelpers.computeNftUri(fileUrl, '');

      const filePath = `${this.STANDARD_PATH}${fileName}`;

      await this.awsService.uploadToS3(filePath, file, fileType);
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`An unhandled error occurred while uploading assets for NFT with identifier '${identifier}', file url '${fileUrl}'`);
    }
  }

  async isAssetUploaded(media: NftMedia): Promise<boolean> {
    try {
      const prefix = (this.apiConfigService.getMediaInternalUrl() ?? this.apiConfigService.getMediaUrl()) + '/nfts/asset';

      const url = TokenHelpers.computeNftUri(media.originalUrl, prefix);

      const isExternalUrl = !url.startsWith(prefix);
      if (isExternalUrl && !await isSafePublicUrl(url)) {
        this.logger.warn(`Refused checking uploaded asset for non-public url '${url}'`);
        return false;
      }

      // eslint-disable-next-line require-await
      const response = await this.apiService.head(url, { skipRedirects: true, httpsAgent: isExternalUrl ? publicHttpsAgent : undefined }, async (error) => {
        const status = error.response?.status;
        if ([HttpStatus.FOUND, HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN].includes(status)) {
          return true;
        }

        return false;
      });

      return response !== undefined;
    } catch (error: any) {
      return false;
    }
  }
}
