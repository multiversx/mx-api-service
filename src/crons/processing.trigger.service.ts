import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
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
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async triggerIfNeedsProcessing() {
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

  @Cron(CronExpression.EVERY_HOUR)
  async triggerProcessingForLastMintedNfts() {
    await Locker.lock('trigger processing for last 24 hours minted nfts', async () => {
      //last 24 hours
      const before = Math.floor(Date.now() / 1000);
      const after = before - Constants.oneDay();
      const nfts = await this.nftService.getNfts({ from: 0, size: 10000 }, { before, after });

      const needToBeProcessedNfts = [];
      for (const nft of nfts) {
        const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings());
        if (needsProcessing) {
          needToBeProcessedNfts.push(nft);
        }
      }

      for (const nft of needToBeProcessedNfts) {
        await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings());
      }
    });
  }
}