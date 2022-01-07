import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import sharp, { fit } from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import path from "path";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { TokenUtils } from "src/utils/token.utils";
import { Constants } from "src/utils/constants";
import { FileUtils } from "src/utils/file.utils";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GenerateThumbnailResult } from "./entities/generate.thumbnail.result";
import { ThumbnailType } from "./entities/thumbnail.type";
import { AWSService } from "./aws.service";
import { ApiService } from "src/common/network/api.service";

@Injectable()
export class NftThumbnailService {
  private readonly logger: Logger;
  private readonly STANDARD_PATH: string = 'nfts/thumbnail';
  private readonly API_TIMEOUT_MILLISECONDS = Constants.oneSecond() * 30 * 1000;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly awsService: AWSService,
    private readonly apiService: ApiService,
  ) {
    this.logger = new Logger(NftThumbnailService.name);
  }

  private async extractThumbnailFromImage(buffer: Buffer): Promise<Buffer | undefined> {
    try {
      return await sharp(buffer)
        .resize(
          {
            width: this.apiConfigService.getImageWidth(),
            height: this.apiConfigService.getImageHeight(),
            fit: fit.cover,
          }
        )
        .toBuffer();
    } catch (error: any) {
      this.logger.error(error);
      return undefined;
    }
  }

  private async getScreenshot(videoPath: string, seek: number, outputPath: string): Promise<void> {
    await new Promise(resolve => {
      ffmpeg(videoPath)
        .seek(seek)
        .takeFrames(1)
        .saveToFile(outputPath)
        .on('end', () => {
          resolve(true);
        });
    });
  }

  private async extractThumbnailFromVideo(file: Buffer, nftIdentifier: string): Promise<Buffer | undefined> {
    const screenshot = await this.extractScreenshotFromVideo(file, nftIdentifier);
    if (!screenshot) {
      return undefined;
    }

    return await this.extractThumbnailFromImage(screenshot);
  }

  private async extractThumbnailFromAudio(buffer: Buffer, nftIdentifier: string): Promise<Buffer | undefined> {
    const audioPath = path.join(this.apiConfigService.getTempUrl(), nftIdentifier);
    await FileUtils.writeFile(buffer, audioPath);

    const outputPath = path.join(this.apiConfigService.getTempUrl(), `${nftIdentifier}.screenshot.png`);

    try {
      await new Promise(resolve => {
        ffmpeg(audioPath)
          .complexFilter([
            { filter: 'showwavespic', options: { s: '600x600', colors: '#1f43f4' } },
          ])
          .frames(1)
          .saveToFile(outputPath)
          .on('end', () => {
            resolve(true);
          });
      });

      const result = await FileUtils.readFile(outputPath);
      return result;
    } finally {
      const fileExists = await FileUtils.exists(outputPath);
      if (fileExists) {
        await FileUtils.deleteFile(outputPath);
      }
    }
  }

  private async extractScreenshotFromVideo(buffer: Buffer, nftIdentifier: string): Promise<Buffer | undefined> {
    // we try to extract frames at 0, 10, 30 seconds, and we take the frame that has the biggest size
    // (i.e. the bigger the size, the more "crisp" an image should be, since it contains more details)
    const frames = [0, 10, 30];
    const filePaths = frames.map(x => path.join(this.apiConfigService.getTempUrl(), `${nftIdentifier}.screenshot.${x}.png`));

    const videoPath = path.join(this.apiConfigService.getTempUrl(), nftIdentifier);
    await FileUtils.writeFile(buffer, videoPath);

    try {
      let maxSizeIndex = -1;
      let maxSize = -1;
      for (const [index, filePath] of filePaths.entries()) {
        await this.getScreenshot(videoPath, frames[index], filePath);

        const fileExists = await FileUtils.exists(filePath);
        if (fileExists) {
          const fileSize = await FileUtils.getFileSize(filePath);
          if (fileSize > maxSize) {
            maxSize = fileSize;
            maxSizeIndex = index;
          }
        }
      }

      if (maxSizeIndex < 0) {
        return undefined;
      }

      return await FileUtils.readFile(filePaths[maxSizeIndex]);
    } catch (error: any) {
      this.logger.error({ error });
      return undefined;
    } finally {
      for (const filePath of filePaths) {
        const fileExists = await FileUtils.exists(filePath);
        if (fileExists) {
          await FileUtils.deleteFile(filePath);
        }
      }

      const fileExists = await FileUtils.exists(videoPath);
      if (fileExists) {
        await FileUtils.deleteFile(videoPath);
      }
    }
  }

  async hasThumbnailGenerated(identifier: string, fileUrl: string): Promise<boolean> {
    const urlIdentifier = TokenUtils.getThumbnailUrlIdentifier(identifier, fileUrl);
    const url = this.getFullThumbnailUrl(urlIdentifier);

    let hasThumbnail = true;
    await this.apiService.head(url, { skipRedirects: true }, async (error) => {
      if (error.response?.status === HttpStatus.NOT_FOUND || error.response?.status === HttpStatus.FOUND) {
        hasThumbnail = false;
        return true;
      }

      return false;
    });

    return hasThumbnail;
  }

  async generateThumbnail(nft: Nft, fileUrl: string, fileType: string, forceRefresh: boolean = false): Promise<GenerateThumbnailResult> {
    const nftIdentifier = nft.identifier;
    const urlHash = TokenUtils.getUrlHash(fileUrl);

    this.logger.log(`Generating thumbnail for NFT with identifier '${nftIdentifier}', url '${fileUrl}' and url hash '${urlHash}'`);

    if (!fileUrl || !fileUrl.startsWith('https://')) {
      this.logger.log(`NFT with identifier '${nftIdentifier}' and url hash '${urlHash}' has no urls`);
      return GenerateThumbnailResult.noUrl;
    }

    const fileResult: any = await this.apiService.get(fileUrl, { responseType: 'arraybuffer', timeout: this.API_TIMEOUT_MILLISECONDS });
    const file = fileResult.data;

    const urlIdentifier = TokenUtils.getThumbnailUrlIdentifier(nftIdentifier, fileUrl);
    if (!forceRefresh) {
      const hasThumbnailGenerated = await this.hasThumbnailGenerated(nftIdentifier, fileUrl);
      if (hasThumbnailGenerated) {
        this.logger.log(`Thumbnail already generated for NFT with identifier '${nftIdentifier}' and url hash '${urlHash}'`);
        return GenerateThumbnailResult.success;
      }
    }

    if (ThumbnailType.isAudio(fileType)) {
      const thumbnail = await this.extractThumbnailFromAudio(file, nftIdentifier);
      if (thumbnail) {
        await this.uploadThumbnail(urlIdentifier, thumbnail, 'image/png');
        this.logger.log(`Successfully generated audio thumbnail for NFT with identifier '${nftIdentifier}' and url hash '${urlHash}'`);
        return GenerateThumbnailResult.success;
      } else {
        this.logger.log(`Thumbnail could not be generated from audio for NFT with identifier '${nftIdentifier}' and url hash '${urlHash}'`);
        return GenerateThumbnailResult.couldNotExtractThumbnail;
      }
    } else if (ThumbnailType.isImage(fileType)) {
      const thumbnail = await this.extractThumbnailFromImage(file);
      if (thumbnail) {
        await this.uploadThumbnail(urlIdentifier, thumbnail, fileType);
        this.logger.log(`Successfully generated image thumbnail for NFT with identifier '${nftIdentifier}' and url hash '${urlHash}'`);
        return GenerateThumbnailResult.success;
      } else {
        this.logger.log(`Thumbnail could not be generated from image for NFT with identifier '${nftIdentifier}' and url hash '${urlHash}'`);
        return GenerateThumbnailResult.couldNotExtractThumbnail;
      }
    } else if (ThumbnailType.isVideo(fileType)) {
      const thumbnail = await this.extractThumbnailFromVideo(file, nftIdentifier);
      if (thumbnail) {
        await this.uploadThumbnail(urlIdentifier, thumbnail, 'image/png');
        this.logger.log(`Successfully generated video thumbnail for NFT with identifier '${nftIdentifier}' and url hash '${urlHash}'`);
        return GenerateThumbnailResult.success;
      } else {
        this.logger.log(`Thumbnail could not be generated from video for NFT with identifier '${nftIdentifier}' and url hash '${urlHash}'`);
        return GenerateThumbnailResult.couldNotExtractThumbnail;
      }
    } else {
      this.logger.log(`Could not determine file type for NFT with identifier '${nftIdentifier}' and file type '${fileType}' and url hash '${urlHash}'`);
      return GenerateThumbnailResult.unrecognizedFileType;
    }
  }

  async uploadThumbnail(urlIdentifier: string, buffer: Buffer, fileType: string): Promise<void> {
    const url = this.getThumbnailUrlSuffix(urlIdentifier);
    await this.awsService.uploadToS3(url, buffer, fileType);
  }

  private getFullThumbnailUrl(urlIdentifier: string): string {
    const suffix = this.getThumbnailUrlSuffix(urlIdentifier);
    const mediaUrl = this.apiConfigService.getMediaInternalUrl() ?? this.apiConfigService.getMediaUrl();

    return `${mediaUrl}/${suffix}`;
  }

  private getThumbnailUrlSuffix(urlIdentifier: string): string {
    return `${this.STANDARD_PATH}/${urlIdentifier}`;
  }
}