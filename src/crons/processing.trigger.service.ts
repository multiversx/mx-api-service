import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftService } from "src/endpoints/nfts/nft.service";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";
import { Constants } from "src/utils/constants";
import { Locker } from "src/utils/locker";

@Injectable()
export class ProcessingTriggerService {
  private readonly logger: Logger;

  constructor(
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.logger = new Logger(ProcessingTriggerService.name);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async triggerProcessNftsForLast24Hours() {
    if (!this.apiConfigService.getIsProcessNftsFlagActive()) {
      return;
    }

    await Locker.lock('Process NFTs minted in the last 24 hours', async () => {
      await this.processNftsFromLast24Hours(async nft => {
        const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings());
        if (needsProcessing) {
          await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings());
        }

        return needsProcessing;
      });
    }, true);
  }

  private async processNftsFromLast24Hours(handler: (nft: Nft) => Promise<boolean>): Promise<void> {
    let before = Math.floor(Date.now() / 1000);
    const after = before - Constants.oneDay();

    const nftIdentifiers = new Set<string>();
    let totalProcessedNfts = 0;

    while (true) {
      let nfts = await this.nftService.getNfts({ from: 0, size: 10000 }, { before, after });

      nfts = nfts.sortedDescending(x => x.timestamp);

      for (const nft of nfts) {
        if (!nftIdentifiers.has(nft.identifier)) {
          const neededProcessing = await handler(nft);
          if (neededProcessing) {
            totalProcessedNfts++;
          }

          nftIdentifiers.add(nft.identifier);
        }
      }

      if (nfts.length < 10000) {
        break;
      }

      before = nfts[nfts.length - 1].timestamp;
    }

    this.logger.log(`Total processed NFTs from the last 24h: ${totalProcessedNfts}`);
  }
}