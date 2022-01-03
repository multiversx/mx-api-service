import { Injectable, Logger } from "@nestjs/common";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { NftThumbnailService } from "./queue/job-services/thumbnails/nft.thumbnail.service";
import { NftMetadataService } from "./queue/job-services/metadata/nft.metadata.service";
import { NftMediaService } from "./queue/job-services/media/nft.media.service";
// import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
// import { TokenUtils } from "src/utils/token.utils";
// import { InjectQueue } from "@nestjs/bull";
// import { Queue } from "bull";

@Injectable()
export class NftWorkerService {
  private readonly logger: Logger;

  constructor(
    // @InjectQueue('nftQueue') private nftQueue: Queue,
    private readonly nftThumbnailService: NftThumbnailService,
    private readonly nftMetadataService: NftMetadataService,
    private readonly nftMediaService: NftMediaService,
  ) {
    this.logger = new Logger(NftWorkerService.name);
  }

  async addProcessNftQueueJob(nft: Nft, settings: ProcessNftSettings): Promise<boolean> {
    nft.metadata = await this.nftMetadataService.getMetadata(nft) ?? undefined;
    nft.media = await this.nftMediaService.getMedia(nft) ?? undefined;

    let needsProcessing = await this.needsProcessing(nft, settings);
    if (!needsProcessing) {
      this.logger.log(`No processing is needed for nft with identifier '${nft.identifier}'`);
      return false;
    }

    if (settings.forceRefreshMetadata || !nft.metadata) {
      nft.metadata = await this.nftMetadataService.refreshMetadata(nft);
    }

    if (settings.forceRefreshMedia || !nft.media) {
      nft.media = await this.nftMediaService.refreshMedia(nft);
    }

    if (nft.media && !settings.skipRefreshThumbnail) {
      await Promise.all(nft.media.map((media: any) => this.nftThumbnailService.generateThumbnail(nft, media.url, media.fileType)));
    }

    // const job = await this.nftQueue.add({ identifier: nft.identifier, nft, settings }, {
    //   priority: 1000,
    //   attempts: 3,
    //   timeout: 60000,
    //   removeOnComplete: true
    // });
    // this.logger.log({ type: 'producer', jobId: job.id, identifier: job.data.identifier, settings });

    return true;
  }

  private async needsProcessing(nft: Nft, settings: ProcessNftSettings): Promise<boolean> {
    if (settings.forceRefreshMedia || settings.forceRefreshMetadata || settings.forceRefreshThumbnail) {
      return true;
    }

    if (!nft.media || nft.media.length === 0) {
      return true;
    }

    if (!nft.metadata) {
      return true;
    }

    if (!settings.skipRefreshThumbnail) {
      if (nft.media) {
        for (let media of nft.media) {
          let hasThumbnailGenerated = await this.nftThumbnailService.hasThumbnailGenerated(nft.identifier, media.url);
          if (!hasThumbnailGenerated) {
            return true;
          }
        }
      }
    }

    return false;
  }
}