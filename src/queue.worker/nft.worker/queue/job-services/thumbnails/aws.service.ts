import { S3 } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { OriginLogger } from '@multiversx/sdk-nestjs-common';

@Injectable()
export class AWSService {
  private readonly logger = new OriginLogger(AWSService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) { }

  public async uploadToS3(path: string, buffer: Buffer, type: string): Promise<string> {
    const s3 = new S3({
      credentials: {
        accessKeyId: this.apiConfigService.getAwsS3KeyId(),
        secretAccessKey: this.apiConfigService.getAwsS3Secret(),
      },
      region: this.apiConfigService.getAwsS3Region(),
    });

    const awsResponse = await s3.putObject({
      Bucket: this.apiConfigService.getAwsS3Bucket(),
      Key: path,
      Body: buffer,
      ContentType: type,
      ACL: 'public-read',
    });

    this.logger.log(`Uploaded ${path} to S3. Response: ${JSON.stringify(awsResponse)} (empty means no error)`);

    const head = await s3.headObject({
      Bucket: this.apiConfigService.getAwsS3Bucket(),
      Key: path,
    });
    this.logger.log(`S3 ${path} HeadObject result: ${JSON.stringify(head)}`);

    return this.getItemPath(path);
  }

  public getItemPath(path: string): string {
    return `https://${this.apiConfigService.getAwsS3Bucket()}/${path}`;
  }
}
