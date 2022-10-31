import { CachingService, OriginLogger } from "@elrondnetwork/erdnest";
import { ApiService, Constants } from "@elrondnetwork/erdnest";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { CacheInfo } from "src/utils/cache.info";
import { CachingUtils } from "src/utils/caching.utils";
import { TokenHelpers } from "src/utils/token.helpers";
import { AWSService } from "../thumbnails/aws.service";

@Injectable()
export class NftAssetService {
  private readonly logger = new OriginLogger(NftAssetService.name);
  private readonly API_TIMEOUT_MILLISECONDS = Constants.oneSecond() * 30 * 1000;
  private readonly STANDARD_PATH: string = 'nfts/asset';

  constructor(
    private readonly apiService: ApiService,
    private readonly awsService: AWSService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
  ) { }

  async uploadAsset(identifier: string, fileUrl: string, fileType: string) {
    const cacheIdentifier = `${identifier}-${TokenHelpers.getUrlHash(fileUrl)}`;

    try {
      const mediaUrl = TokenHelpers.computeNftUri(fileUrl, this.apiConfigService.getMediaUrl() + '/nfts/asset');

      const fileResult: any = await CachingUtils.executeOptimistic({
        cachingService: this.cachingService,
        description: `Uploading assets to S3 for NFT with identifier '${identifier}', file url '${fileUrl}'`,
        key: CacheInfo.PendingUploadAsset(cacheIdentifier).key,
        ttl: CacheInfo.PendingUploadAsset(cacheIdentifier).ttl,
        action: async () => await this.apiService.get(mediaUrl, { responseType: 'arraybuffer', timeout: this.API_TIMEOUT_MILLISECONDS }),
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

      // eslint-disable-next-line require-await
      const response = await this.apiService.head(url, undefined, async (error) => {
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
