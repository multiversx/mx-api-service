import { Process, Processor } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bull";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
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
  async onNftCreated(job: Job<{ identifier: string, nft: Nft }>) {
    this.logger.log({ type: 'consumer', jobId: job.id, identifier: job.data.identifier, attemptsMade: job.attemptsMade });

    let nft = job.data.nft;

    await this.nftMetadataService.fetchMetadata(nft);
    await this.nftMediaService.fetchMedia(nft);

    if (nft.media) {
      await Promise.all(nft.media.map(media => this.generateThumbnail(nft, media)));
    }
  }

  private async generateThumbnail(nft: Nft, media: NftMedia): Promise<void> {
    await this.nftThumbnailService.generateThumbnail(nft, media.url, media.fileType);
  }
}