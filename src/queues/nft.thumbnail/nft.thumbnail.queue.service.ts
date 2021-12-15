import { Process, Processor } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bull";
import { GenerateThumbnailResult } from "src/endpoints/nft/entities/generate.thumbnail.result";
import { NftThumbnailService } from "src/endpoints/nft/nft.thumbnail.service";

@Injectable()
@Processor('nftThumbnails')
export class NftThumbnailQueueService {
  private readonly logger: Logger

  constructor(
    private readonly nftThumbnailService: NftThumbnailService,
  ) {
    this.logger = new Logger(NftThumbnailQueueService.name);
  }

  @Process({ concurrency: 4 })
  async onNftCreated(job: Job<{ identifier: string, nft: any, fileUrl: string, fileType: string }>) {
    this.logger.log({ type: 'consumer', jobId: job.id, identifier: job.data.identifier, attemptsMade: job.attemptsMade });

    let generateResult = await this.nftThumbnailService.generateThumbnail(job.data.nft, job.data.fileUrl, job.data.fileType);
    this.logger.log(`Result when generating thumbnail for NFT with identifier '${job.data.identifier}' is '${generateResult}'`);

    if (generateResult === GenerateThumbnailResult.noMetadata) {
      throw new Error(`No metadata identified for NFT with identifier '${job.data.identifier}'`);
    } else if (generateResult === GenerateThumbnailResult.unhandledException) {
      throw new Error(`An unhandled exception occurred for NFT with identifier '${job.data.identifier}'`);
    }
  }
}