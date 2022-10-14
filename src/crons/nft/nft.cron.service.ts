import { OriginLogger } from "@elrondnetwork/erdnest";
import { Constants, Locker } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftExtendedAttributesService } from "src/endpoints/nfts/nft.extendedattributes.service";
import { NftService } from "src/endpoints/nfts/nft.service";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";

@Injectable()
export class NftCronService {
  private readonly logger = new OriginLogger(NftCronService.name);

  constructor(
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly apiConfigService: ApiConfigService,
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
  ) { }

  @Cron(CronExpression.EVERY_HOUR)
  async triggerProcessNftsForLast24Hours() {
    if (!this.apiConfigService.getIsProcessNftsFlagActive()) {
      return;
    }

    await Locker.lock('Process NFTs minted in the last 24 hours', async () => {
      const dayBefore = Math.floor(Date.now() / 1000) - Constants.oneDay();
      await this.processNfts(dayBefore, async nft => {
        const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings({ uploadAsset: true }));
        if (needsProcessing) {
          await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({ uploadAsset: true }));
        }

        return needsProcessing;
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async triggerProcessNftsForLastYear() {
    if (!this.apiConfigService.getIsProcessNftsFlagActive()) {
      return;
    }

    await Locker.lock('Process NFTs minted in the last year', async () => {
      const yearBefore = Math.floor(Date.now() / 1000) - (Constants.oneDay() * 365);
      await this.processNfts(yearBefore, async nft => {
        let needsRefreshMetadataProcessing: boolean = false;

        if (nft.attributes) {
          let metadataLink: string | undefined = undefined;
          try {
            metadataLink = this.nftExtendedAttributesService.getMetadataFromBase64EncodedAttributes(nft.attributes);
          } catch (error) {
            this.logger.error(`An unhandled exception occurred when parsing metadata from attributes for NFT with identifier '${nft.identifier}'`);
            this.logger.error(error);
          }

          if (metadataLink && (!nft.metadata || Object.keys(nft.metadata).length === 0)) {
            await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({ forceRefreshMetadata: true }));
            needsRefreshMetadataProcessing = true;
          }
        }

        return needsRefreshMetadataProcessing;
      });
    }, true);
  }

  private async processNfts(after: number, handler: (nft: Nft) => Promise<boolean>): Promise<void> {
    let before = Math.floor(Date.now() / 1000) - (Constants.oneMinute() * 10);

    const nftIdentifiers = new Set<string>();
    let totalProcessedNfts = 0;
    let totalNfts = 0;

    const allNftCount = await this.nftService.getNftCount({ before, after });

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

            totalNfts++;

            nftIdentifiers.add(nft.identifier);
          } catch (error) {
            this.logger.error(`Failure when determining whether the NFT with the identifier '${nft.identifier}' needs processing`);
            this.logger.error(error);
          }
        }
      }

      this.logger.log(`Completed processing ${totalNfts} / ${allNftCount} NFTs`);

      if (nfts.length < 10000) {
        break;
      }

      before = nfts[nfts.length - 1].timestamp ?? 0;
    }

    this.logger.log(`Total processed NFTs from the last 24h: ${totalProcessedNfts}`);
  }
}
