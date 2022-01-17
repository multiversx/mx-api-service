import { Inject, Injectable, Logger } from "@nestjs/common";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { NftThumbnailService } from "./queue/job-services/thumbnails/nft.thumbnail.service";
import { NftMetadataService } from "./queue/job-services/metadata/nft.metadata.service";
import { NftMediaService } from "./queue/job-services/media/nft.media.service";
import { ClientProxy } from "@nestjs/microservices";
import { NftMessage } from "./queue/entities/nft.message";

@Injectable()
export class NftWorkerService {
  private readonly logger: Logger;

  constructor(
    private readonly nftThumbnailService: NftThumbnailService,
    private readonly nftMetadataService: NftMetadataService,
    private readonly nftMediaService: NftMediaService,
    @Inject('QUEUE_SERVICE') private readonly client: ClientProxy,
  ) {
    this.logger = new Logger(NftWorkerService.name);
  }

  async addProcessNftQueueJob(nft: Nft, settings: ProcessNftSettings): Promise<boolean> {
    nft.metadata = await this.nftMetadataService.getMetadata(nft) ?? undefined;
    nft.media = await this.nftMediaService.getMedia(nft) ?? undefined;

    const needsProcessing = await this.needsProcessing(nft, settings);
    if (!needsProcessing) {
      this.logger.log(`No processing is needed for nft with identifier '${nft.identifier}'`);
      return false;
    }

    const message = new NftMessage();
    message.identifier = nft.identifier;
    message.nft = nft;
    message.settings = settings;

    this.client.send({ cmd: 'process-nfts' }, message).subscribe();

    return true;
  }

  async needsProcessing(nft: Nft, settings: ProcessNftSettings): Promise<boolean> {
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
        for (const media of nft.media) {
          const hasThumbnailGenerated = await this.nftThumbnailService.hasThumbnailGenerated(nft.identifier, media.url);
          if (!hasThumbnailGenerated) {
            return true;
          }
        }
      }
    }

    return false;
  }
}