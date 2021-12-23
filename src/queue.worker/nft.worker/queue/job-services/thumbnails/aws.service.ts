import { S3 } from "@aws-sdk/client-s3";
import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";

@Injectable()
export class AWSService {
  private readonly logger: Logger;
  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.logger = new Logger(AWSService.name);
  }

  public async uploadToS3(path: string, buffer: Buffer, type: string): Promise<string> {
    const s3 = new S3({
      credentials: {
        accessKeyId: this.apiConfigService.getAwsS3KeyId(),
        secretAccessKey: this.apiConfigService.getAwsS3Secret(),
      },
      region: this.apiConfigService.getAwsS3Region(),
    });

    try {
      await s3.putObject({
        Bucket: this.apiConfigService.getAwsS3Bucket(),
        Key: path,
        Body: buffer,
        ContentType: type,
      });
    } catch (err) {
      this.logger.log(`Error when uploading thumbnail to S3 for path '${path}'`);
      this.logger.error(err);
    }

    return this.getItemPath(path);
  }

  public getItemPath(path: string): string {
    return `https://${this.apiConfigService.getAwsS3Bucket()}/${path}`;
  }
}