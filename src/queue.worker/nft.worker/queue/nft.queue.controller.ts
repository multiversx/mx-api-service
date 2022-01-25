import { Controller, Logger } from "@nestjs/common";
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { NftMessage } from "./entities/nft.message";
import { NftMediaService } from "./job-services/media/nft.media.service";
import { NftMetadataService } from "./job-services/metadata/nft.metadata.service";
import { NftThumbnailService } from "./job-services/thumbnails/nft.thumbnail.service";

@Controller()
export class NftQueueController {
  private readonly logger: Logger;

  constructor(
    private readonly nftMetadataService: NftMetadataService,
    private readonly nftMediaService: NftMediaService,
    private readonly nftThumbnailService: NftThumbnailService,
  ) {
    this.logger = new Logger(NftQueueController.name);
  }

  @MessagePattern({ cmd: 'process-nfts' })
  async onNftCreated(@Payload() data: NftMessage, @Ctx() context: RmqContext) {
    this.logger.log({ type: 'consumer start', identifier: data.identifier });

    const nft = data.nft;
    const settings = data.settings;

    nft.metadata = await this.nftMetadataService.getMetadata(nft);

    if (settings.forceRefreshMetadata || !nft.metadata) {
      nft.metadata = await this.nftMetadataService.refreshMetadata(nft);
    }

    nft.media = await this.nftMediaService.getMedia(nft) ?? undefined;

    if (settings.forceRefreshMedia || !nft.media) {
      nft.media = await this.nftMediaService.refreshMedia(nft);
    }

    if (nft.media && !settings.skipRefreshThumbnail) {
      await Promise.all(nft.media.map((media: any) => this.generateThumbnail(nft, media, settings.forceRefreshThumbnail)));
    }

    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    this.logger.log({ type: 'consumer end', identifier: data.identifier });
    channel.ack(originalMsg);
  }

  private async generateThumbnail(nft: Nft, media: NftMedia, forceRefresh: boolean = false): Promise<void> {
    try {
      await this.nftThumbnailService.generateThumbnail(nft, media.url, media.fileType, forceRefresh);
    } catch (error) {
      this.logger.error(`An unhandled exception occurred when generating thumbnail for nft with identifier '${nft.identifier}' and url '${media.url}'`);
      this.logger.error(error);
      throw error;
    }
  }
}