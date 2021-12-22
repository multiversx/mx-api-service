import { Process, Processor } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bull";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { TokenUtils } from "src/utils/token.utils";
import { NftMediaService } from "./job-services/media/nft.media.service";
import { NftMetadataService } from "./job-services/metadata/nft.metadata.service";
import { NftThumbnailService } from "./job-services/thumbnails/nft.thumbnail.service";

@Injectable()
@Processor('nftQueue')
export class NftQueueService {
  private readonly logger: Logger

  constructor(
    private readonly nftMetadataService: NftMetadataService,
    private readonly nftMediaService: NftMediaService,
    private readonly nftThumbnailService: NftThumbnailService,
  ) {
    this.logger = new Logger(NftQueueService.name);
  }

  @Process({ concurrency: 4 })
  async onNftCreated(job: Job<{ identifier: string, nft: Nft, settings: ProcessNftSettings }>) {
    this.logger.log({ type: 'consumer', jobId: job.id, identifier: job.data.identifier, attemptsMade: job.attemptsMade });

    let nft = job.data.nft;
    let settings = job.data.settings;

    await this.nftMetadataService.fetchMetadata(nft, settings.forceRefreshMetadata);
    await this.nftMediaService.fetchMedia(nft, settings.forceRefreshMedia);

    if (nft.media && !settings.skipRefreshThumbnail) {
      await Promise.all(nft.media.map(media => this.generateThumbnail(nft, media, settings.forceRefreshThumbnail)));
    }
  }

  private async generateThumbnail(nft: Nft, media: NftMedia, excludeThumbnail: boolean = false): Promise<void> {
    try {
      if (!excludeThumbnail) {
        await this.nftThumbnailService.generateThumbnail(nft, media.url, media.fileType);
      } else {
        const urlHash = TokenUtils.getUrlHash(media.url);
        this.logger.log(`Skip generating thumbnail for NFT with identifier '${nft.identifier}' and url hash '${urlHash}'`);
      }
    } catch (error) {
      this.logger.error(`An unhandled exception occurred when generating thumbnail for nft with identifier '${nft.identifier}' and url '${media.url}'`);
      this.logger.error(error);
      throw error;
    }
  }
}