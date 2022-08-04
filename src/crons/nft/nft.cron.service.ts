import { Constants, Locker } from "@elrondnetwork/erdnest";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftService } from "src/endpoints/nfts/nft.service";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";

@Injectable()
export class NftCronService {
  private readonly logger: Logger;

  constructor(
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.logger = new Logger(NftCronService.name);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async triggerProcessNftsForLast24Hours() {
    if (!this.apiConfigService.getIsProcessNftsFlagActive()) {
      return;
    }

    await Locker.lock('Process NFTs minted in the last 24 hours', async () => {
      await this.processNftsFromLast24Hours(async nft => {
        const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings({ uploadAsset: true }));
        if (needsProcessing) {
          await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({ uploadAsset: true }));
        }

        return needsProcessing;
      });
    }, true);
  }

  private async processNftsFromLast24Hours(handler: (nft: Nft) => Promise<boolean>): Promise<void> {
    let before = Math.floor(Date.now() / 1000) - (Constants.oneMinute() * 10);
    const after = before - Constants.oneDay();

    const nftIdentifiers = new Set<string>();
    let totalProcessedNfts = 0;

    while (true) {
      let nfts = await this.nftService.getNfts({ from: 0, size: 10000 }, { before, after });

      nfts = nfts.sortedDescending(x => x.timestamp ?? 0);

      for (const nft of nfts) {
        if (nft.identifier && !nftIdentifiers.has(nft.identifier)) {
          try {
            const neededProcessing = await handler(nft);
            if (neededProcessing) {
              totalProcessedNfts++;
            }

            nftIdentifiers.add(nft.identifier);
          } catch (error) {
            this.logger.error(`Failure when determining whether the NFT with the identifier '${nft.identifier}' needs processing`);
            this.logger.error(error);
          }
        }
      }

      if (nfts.length < 10000) {
        break;
      }

      before = nfts[nfts.length - 1].timestamp ?? 0;
    }

    this.logger.log(`Total processed NFTs from the last 24h: ${totalProcessedNfts}`);
  }
}
