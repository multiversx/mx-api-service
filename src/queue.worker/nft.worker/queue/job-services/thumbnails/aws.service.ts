import { Injectable } from "@nestjs/common";
import { Credentials, S3 } from "aws-sdk";
import { ApiConfigService } from "src/common/api-config/api.config.service";

@Injectable()
export class AWSService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
  ) { }

  public async uploadToS3(path: string, buffer: Buffer, type: string): Promise<string> {
    const CREDENTIALS = new Credentials({
      accessKeyId: this.apiConfigService.getAwsS3KeyId(),
      secretAccessKey: this.apiConfigService.getAwsS3Secret()
    });
    const s3 = new S3({ credentials: CREDENTIALS });

    await new Promise((resolve, reject) => {
      s3.upload({
        Bucket: this.apiConfigService.getAwsS3Bucket(),
        Key: path,
        Body: buffer,
        ContentType: type
      }, (err, data) => {
        if (err) {
          reject(err);
        }

        resolve(data);
      });
    });

    return this.getItemPath(path);
  }

  public getItemPath(path: string): string {
    return `https://${this.apiConfigService.getAwsS3Bucket()}/${path}`;
  }
}