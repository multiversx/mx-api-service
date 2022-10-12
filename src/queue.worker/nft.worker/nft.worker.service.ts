import { Inject, Injectable } from "@nestjs/common";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { NftThumbnailService } from "./queue/job-services/thumbnails/nft.thumbnail.service";
import { NftMetadataService } from "./queue/job-services/metadata/nft.metadata.service";
import { NftMediaService } from "./queue/job-services/media/nft.media.service";
import { ClientProxy } from "@nestjs/microservices";
import { NftMessage } from "./queue/entities/nft.message";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftAssetService } from "./queue/job-services/assets/nft.asset.service";
import { PersistenceService } from "src/common/persistence/persistence.service";
import { OriginLogger } from "@elrondnetwork/erdnest";

@Injectable()
export class NftWorkerService {
  private readonly logger = new OriginLogger(NftWorkerService.name);

  constructor(
    private readonly nftThumbnailService: NftThumbnailService,
    private readonly nftMetadataService: NftMetadataService,
    private readonly nftMediaService: NftMediaService,
    private readonly nftAssetService: NftAssetService,
    @Inject('QUEUE_SERVICE') private readonly client: ClientProxy,
    private readonly persistenceService: PersistenceService,
  ) { }

  async addProcessNftQueueJob(nft: Nft, settings: ProcessNftSettings): Promise<boolean> {
    nft.metadata = await this.nftMetadataService.getMetadata(nft) ?? undefined;
    nft.media = await this.nftMediaService.getMedia(nft.identifier) ?? undefined;

    const needsProcessing = await this.needsProcessing(nft, settings);
    if (!needsProcessing) {
      this.logger.log(`No processing is needed for nft with identifier '${nft.identifier}'`);
      return false;
    }

    const message = new NftMessage();
    message.identifier = nft.identifier;
    message.settings = settings;

    this.client.send({ cmd: 'api-process-nfts' }, message).subscribe();

    return true;
  }

  async needsProcessing(nft: Nft, settings: ProcessNftSettings): Promise<boolean> {
    if (nft.type === NftType.MetaESDT) {
      return false;
    }

    if (settings.forceRefreshMedia || settings.forceRefreshMetadata || settings.forceRefreshThumbnail) {
      return true;
    }

    const media = await this.persistenceService.getMedia(nft.identifier);
    if (media === null) {
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

    if (settings.uploadAsset) {
      for (const mediaItem of media) {
        const isAssetUploaded = await this.nftAssetService.isAssetUploaded(mediaItem);
        if (!isAssetUploaded) {
          return true;
        }
      }
    }

    return false;
  }
}
