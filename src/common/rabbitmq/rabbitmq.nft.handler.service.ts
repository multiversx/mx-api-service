import { Injectable } from '@nestjs/common';
import { NftService } from 'src/endpoints/nfts/nft.service';
import { ProcessNftSettings } from 'src/endpoints/process-nfts/entities/process.nft.settings';
import { NftWorkerService } from 'src/queue.worker/nft.worker/nft.worker.service';
import { NftCreateEvent } from './entities/nft/nft-create.event';

@Injectable()
export class RabbitMqNftHandlerService {

  constructor(
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
  ) { }

  public async handleNftCreateEvent(event: NftCreateEvent): Promise<void> {
    const identifier = event.getTopics()?.identifier;

    const nft = await this.nftService.getSingleNft(identifier);
    if (!nft) {
      return;
    }

    const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings());
    if (needsProcessing) {
      await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings());
    }
  }
}
