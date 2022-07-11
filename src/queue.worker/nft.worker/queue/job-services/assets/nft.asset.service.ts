import { ApiService, Constants } from "@elrondnetwork/erdnest";
import { Injectable, Logger } from "@nestjs/common";
import { AWSService } from "../thumbnails/aws.service";

@Injectable()
export class NftAssetService {
  private readonly logger: Logger;
  private readonly API_TIMEOUT_MILLISECONDS = Constants.oneSecond() * 30 * 1000;
  private readonly STANDARD_PATH: string = 'nfts/asset';

  constructor(
    private readonly apiService: ApiService,
    private readonly awsService: AWSService
  ) {
    this.logger = new Logger(NftAssetService.name);
  }

  async uploadAsset(identifier: string, fileUrl: string, fileType: string) {
    this.logger.log(`Started uploading assets to S3 for NFT '${identifier}'`);

    const fileResult: any = await this.apiService.get(fileUrl, { responseType: 'arraybuffer', timeout: this.API_TIMEOUT_MILLISECONDS });
    const file = fileResult.data;

    const fileName = fileUrl.split('/').slice(-2, -1);
    this.logger.log(`Extracted filename '${fileName}' for NFT '${identifier}'`);

    const filePath = `${this.STANDARD_PATH}/${fileName}`;

    await this.awsService.uploadToS3(filePath, file, fileType);

    this.logger.log(`Asset uploaded to S3 for NFT '${identifier}'`);
  }
}
