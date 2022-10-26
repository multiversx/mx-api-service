import { OriginLogger } from "@elrondnetwork/erdnest";
import { Constants, Locker } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SettingsService } from "src/common/settings/settings.service";
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
    private readonly settingsService: SettingsService,
    private readonly nftExtendedAttributesService: NftExtendedAttributesService,
  ) { }

  @Cron(CronExpression.EVERY_HOUR)
  async triggerProcessNftsForLast24Hours() {
    const isProcessNftsFlagActive = await this.settingsService.getIsProcessNftsFlagActive();
    if (!isProcessNftsFlagActive) {
      return;
    }

    await Locker.lock('Process NFTs minted in the last 24 hours', async () => {
      const dayBefore = Math.floor(Date.now() / 1000) - Constants.oneDay();
      await this.processNfts(dayBefore, async nft => {
        const needsUploadAsset = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings({ uploadAsset: true }));
        if (needsUploadAsset) {
          await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({ uploadAsset: true }));
        }

        const needsRefreshMetadata = this.needsMetadataRefresh(nft);
        if (needsRefreshMetadata) {
          await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({ forceRefreshMetadata: true }));
        }

        const needsRefreshMedia = this.needsMediaRefresh(nft);
        if (needsRefreshMedia) {
          await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({ forceRefreshMedia: true }));
        }

        return needsUploadAsset;
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async triggerProcessNftsForLastYear() {
    const isProcessNftsFlagActive = await this.settingsService.getIsProcessNftsFlagActive();
    if (!isProcessNftsFlagActive) {
      return;
    }

    await Locker.lock('Process NFTs without media / metadata', async () => {
      await this.processNfts(undefined, async nft => {
        const needsProcessing = this.needsMediaFetch(nft) || this.needsMetadataFetch(nft);
        if (needsProcessing) {
          await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings());
        }

        return needsProcessing;
      });
    }, true);
  }

  private needsMediaRefresh(nft: Nft): boolean {
    // we have uris but we don't have any media items
    return nft.uris && nft.uris.length > 0 && (!nft.media || nft.media.length === 0);
  }

  private needsMetadataRefresh(nft: Nft): boolean {
    // no attributes => we don't have metadata
    if (!nft.attributes) {
      return false;
    }

    // metadata has keys => should be all good
    if (nft.metadata && Object.keys(nft.metadata).length > 0) {
      return false;
    }

    try {
      const metadataLink = this.nftExtendedAttributesService.getMetadataFromBase64EncodedAttributes(nft.attributes);
      if (!metadataLink) {
        return false;
      }
    } catch (error) {
      this.logger.error(`An unhandled exception occurred when parsing metadata from attributes for NFT with identifier '${nft.identifier}'`);
      this.logger.error(error);
      return false;
    }

    return true;
  }

  private needsMetadataFetch(nft: Nft): boolean {
    if (nft.metadata || !nft.attributes) {
      return false;
    }

    try {
      const metadataLink = this.nftExtendedAttributesService.getMetadataFromBase64EncodedAttributes(nft.attributes);
      if (!metadataLink) {
        return false;
      }
    } catch (error) {
      this.logger.error(`An unhandled exception occurred when parsing metadata from attributes for NFT with identifier '${nft.identifier}'`);
      this.logger.error(error);
      return false;
    }

    return true;
  }

  private needsMediaFetch(nft: Nft): boolean {
    // we have uris but we don't have any media record at all
    return nft.uris && nft.uris.length > 0 && !nft.media;
  }

  private async processNfts(after: number | undefined, handler: (nft: Nft) => Promise<boolean>): Promise<void> {
    let before = Math.floor(Date.now() / 1000) - (Constants.oneMinute() * 10);

    const nftIdentifiers = new Set<string>();
    let totalProcessedNfts = 0;
    let totalNfts = 0;

    const allNftCount = await this.nftService.getNftCount({ before, after });

    while (true) {
      let nfts = await this.nftService.getNfts({ from: 0, size: 10000 }, { before, after });

      nfts = nfts.sortedDescending(x => x.timestamp ?? 0);

      for (const [index, nft] of nfts.entries()) {
        if (index % 100 === 0) {
          // yield for 100ms every 100 records, to solve potential issues with synchronous execution
          await new Promise(resolve => setTimeout(resolve, 10));
        }

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
