import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { Nft } from "src/endpoints/nfts/entities/nft";

@Injectable()
export class NftWorkerService {
  private readonly logger: Logger;

  constructor(
    @InjectQueue('nftQueue') private nftQueue: Queue
  ) {
    this.logger = new Logger(NftWorkerService.name);
  }

  async addProcessNftQueueJob(nft: Nft | undefined): Promise<void> {
    if (!nft) {
      return;
    }

    const job = await this.nftQueue.add({ identifier: nft.identifier, nft }, {
      priority: 1000,
      attempts: 3,
      timeout: 60000,
      removeOnComplete: true
    });

    this.logger.log({ type: 'producer', jobId: job.id, identifier: job.data.identifier });
  }
}