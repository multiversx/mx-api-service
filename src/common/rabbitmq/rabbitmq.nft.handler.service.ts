import { Injectable, Logger } from '@nestjs/common';
import { NftService } from 'src/endpoints/nfts/nft.service';
import { ProcessNftSettings } from 'src/endpoints/process-nfts/entities/process.nft.settings';
import { NftWorkerService } from 'src/queue.worker/nft.worker/nft.worker.service';
import { NftCreateEvent } from './entities/nft/nft-create.event';

@Injectable()
export class RabbitMqNftHandlerService {
  private readonly logger: Logger;

  constructor(
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
  ) {
    this.logger = new Logger(RabbitMqNftHandlerService.name);
  }

  public async handleNftCreateEvent(event: NftCreateEvent): Promise<void> {
    const identifier = event.getTopics()?.identifier;

    this.logger.log(`Detected 'ESDTNFTCreate' event for NFT with identifier '${identifier}'`);

    const nft = await this.nftService.getSingleNft(identifier);
    if (!nft) {
      this.logger.log(`Could not fetch NFT details for NFT with identifier '${identifier}'`);
      return;
    }

    try {
      const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings());
      if (needsProcessing) {
        await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings());
      }
    } catch (error) {
      this.logger.error(`An unhandled error occurred when processing NFT with identifier '${identifier}'`);
      this.logger.error(error);
    }
  }
}
