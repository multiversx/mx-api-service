import { Controller, Inject, Logger } from "@nestjs/common";
import { ClientProxy, Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheInfo } from "src/utils/cache.info";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftMessage } from "./entities/nft.message";
import { NftMediaService } from "./job-services/media/nft.media.service";
import { NftMetadataService } from "./job-services/metadata/nft.metadata.service";
import { GenerateThumbnailResult } from "./job-services/thumbnails/entities/generate.thumbnail.result";
import { NftThumbnailService } from "./job-services/thumbnails/nft.thumbnail.service";
import { NftAssetService } from "./job-services/assets/nft.asset.service";

@Controller()
export class NftQueueController {
  private readonly logger: Logger;
  private readonly RETRY_LIMIT: Number;

  constructor(
    private readonly nftMetadataService: NftMetadataService,
    private readonly nftMediaService: NftMediaService,
    private readonly nftThumbnailService: NftThumbnailService,
    private readonly nftService: NftService,
    private readonly nftAssetService: NftAssetService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    apiConfigService: ApiConfigService,
  ) {
    this.logger = new Logger(NftQueueController.name);
    this.RETRY_LIMIT = apiConfigService.getNftProcessMaxRetries();
  }

  private getAttempt(msg: any): number {
    const headers = msg.properties.headers;

    let attempt = 0;
    if (headers['x-death']) {
      const currentXDeath = headers['x-death'][0];
      if (currentXDeath) {
        attempt = currentXDeath.count;
      }
    }

    return attempt;
  }

  @MessagePattern({ cmd: 'api-process-nfts' })
  async onNftCreated(@Payload() data: NftMessage, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    const attempt = this.getAttempt(message);

    if (attempt >= this.RETRY_LIMIT) {
      this.logger.log(`NFT ${data.identifier} reached maximum number of retries (${this.RETRY_LIMIT})! Removed from retry exchange!`);
      channel.ack(message);
      return;
    }

    this.logger.log({ type: 'consumer start', identifier: data.identifier, attempt });

    try {
      const nft = await this.nftService.getSingleNft(data.identifier);
      if (!nft) {
        throw new Error(`Could not fetch details for NFT with identifier '${data.identifier}'`);
      }

      const settings = data.settings;

      nft.metadata = await this.nftMetadataService.getMetadata(nft);

      if (nft.metadata && settings.forceRefreshMetadata) {
        const oldMetadata = nft.metadata;
        nft.metadata = await this.refreshMetadata(nft);
        const newMetadata = nft.metadata;
        if (newMetadata) {
          this.logger.log(`Refreshed NFT metadata. Old: '${JSON.stringify(oldMetadata)}', New: '${JSON.stringify(newMetadata)}'`);
        } else {
          this.logger.log(`Refreshed NFT metadata. Old: '${JSON.stringify(oldMetadata)}', New is empty`);
        }

        this.clientProxy.emit('deleteCacheKeys', [CacheInfo.NftMetadata(nft.identifier).key]);
      } else if (!nft.metadata) {
        nft.metadata = await this.refreshMetadata(nft);
      }

      nft.media = await this.nftMediaService.getMedia(nft.identifier) ?? undefined;

      if (settings.forceRefreshMedia || !nft.media) {
        nft.media = await this.nftMediaService.refreshMedia(nft);
      }

      if (nft.media && settings.uploadAsset) {
        for (const media of nft.media) {
          const isAssetUploaded = await this.nftAssetService.isAssetUploaded(nft.identifier, media);

          if (!isAssetUploaded) {
            await this.nftAssetService.uploadAsset(nft.identifier, media.originalUrl, media.fileType);
          } else {
            this.logger.log(`Asset already uploaded for NFT with identifier '${nft.identifier}' and media url '${media.url}'`);
          }
        }
      }

      if (nft.media && !settings.skipRefreshThumbnail) {
        await Promise.all(nft.media.map((media: any) => this.generateThumbnail(nft, media, settings.forceRefreshThumbnail)));
      }

      this.logger.log({ type: 'consumer end', identifier: data.identifier });

      channel.ack(message);
    } catch (error: any) {
      this.logger.error(`Unexpected error when processing NFT with identifier '${data.identifier}'`);
      this.logger.error(error);

      channel.reject(message, false);
    }
  }

  private async refreshMetadata(nft: Nft) {
    return await this.nftMetadataService.refreshMetadata(nft);
  }

  private async generateThumbnail(nft: Nft, media: NftMedia, forceRefresh: boolean = false): Promise<void> {
    let result: GenerateThumbnailResult;
    try {
      result = await this.nftThumbnailService.generateThumbnail(nft, media.url, media.fileType, forceRefresh);
    } catch (error) {
      this.logger.error(`An unhandled exception occurred when generating thumbnail for nft with identifier '${nft.identifier}' and url '${media.url}'`);
      this.logger.error(error);
      throw error;
    }

    if (result === GenerateThumbnailResult.couldNotExtractThumbnail) {
      throw new Error(`Could not extract thumbnail for for nft with identifier '${nft.identifier}' and url '${media.url}'`);
    }
  }
}
