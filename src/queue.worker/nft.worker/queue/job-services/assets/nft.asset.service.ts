import { ApiService, Constants } from "@elrondnetwork/erdnest";
import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { TokenUtils } from "src/utils/token.utils";
import { AWSService } from "../thumbnails/aws.service";

@Injectable()
export class NftAssetService {
  private readonly logger: Logger;
  private readonly API_TIMEOUT_MILLISECONDS = Constants.oneSecond() * 30 * 1000;
  private readonly STANDARD_PATH: string = 'nfts/asset';

  constructor(
    private readonly apiService: ApiService,
    private readonly awsService: AWSService,
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.logger = new Logger(NftAssetService.name);
  }

  async uploadAsset(identifier: string, fileUrl: string, fileType: string) {
    this.logger.log(`Started uploading assets to S3 for NFT with identifier '${identifier}', file url '${fileUrl}'`);

    try {
      const mediaUrl = TokenUtils.computeNftUri(fileUrl, this.apiConfigService.getMediaUrl() + '/nfts/asset');

      const fileResult: any = await this.apiService.get(mediaUrl, { responseType: 'arraybuffer', timeout: this.API_TIMEOUT_MILLISECONDS });
      const file = fileResult.data;

      const fileName = TokenUtils.computeNftUri(fileUrl, '');

      const filePath = `${this.STANDARD_PATH}${fileName}`;

      await this.awsService.uploadToS3(filePath, file, fileType);

      this.logger.log(`Asset uploaded to S3 for NFT '${identifier}', file url '${fileUrl}'`);
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`An unhandled error occurred while uploading assets for NFT with identifier '${identifier}', file url '${fileUrl}'`);
    }
  }

  async isAssetUploaded(media: NftMedia): Promise<boolean> {
    try {
      const prefix = (this.apiConfigService.getMediaInternalUrl() ?? this.apiConfigService.getMediaUrl()) + '/nfts/asset';

      const url = TokenUtils.computeNftUri(media.originalUrl, prefix);

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
