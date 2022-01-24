import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftService } from "src/endpoints/nfts/nft.service";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";
import { Constants } from "src/utils/constants";
import { Locker } from "src/utils/locker";

@Injectable()
export class ProcessingTriggerService {
  constructor(
    private readonly collectionService: CollectionService,
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async triggerProcessAllNfts() {
    if (!this.apiConfigService.getIsProcessNftsFlagActive()) {
      return;
    }

    await Locker.lock('trigger processing for nfts', async () => {
      const collections = await this.collectionService.getNftCollections({ from: 0, size: 10000 }, new CollectionFilter());

      const needToBeProcessedNfts = [];
      for (const collection of collections) {
        const nfts = await this.nftService.getNfts({ from: 0, size: 10000 }, { collection: collection.name });

        for (const nft of nfts) {
          const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings());
          if (needsProcessing) {
            needToBeProcessedNfts.push(nft);
          }
        }
      }

      for (const nft of needToBeProcessedNfts) {
        await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings());
      }
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async triggerProcessNftsForLast24Hours() {
    if (!this.apiConfigService.getIsProcessNftsFlagActive()) {
      return;
    }

    await Locker.lock('trigger processing for last 24 hours minted nfts', async () => {
      await this.processNftsFromLast24Hours(async nft => {
        const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings());
        if (needsProcessing) {
          await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings());
        }
      });
    });
  }

  private async processNftsFromLast24Hours(handler: (nft: Nft) => Promise<void>): Promise<void> {
    let before = Math.floor(Date.now() / 1000);
    const after = before - Constants.oneDay();

    const nftIdentifiers = new Set<string>();

    while (true) {
      console.log({ before, after });

      let nfts = await this.nftService.getNfts({ from: 0, size: 10000 }, { before, after });

      console.log({ length: nfts.length });

      nfts = nfts.sortedDescending(x => x.timestamp);

      let hasAddedNft = false;
      for (const nft of nfts) {
        if (!nftIdentifiers.has(nft.identifier)) {
          await handler(nft);
          nftIdentifiers.add(nft.identifier);
          hasAddedNft = true;
        }
      }

      if (!hasAddedNft) {
        break;
      }

      before = nfts[nfts.length - 1].timestamp;
    }
  }
}