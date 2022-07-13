import { CachingService, Constants, Locker } from "@elrondnetwork/erdnest";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftService } from "src/endpoints/nfts/nft.service";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";
import { NftAssetService } from "src/queue.worker/nft.worker/queue/job-services/assets/nft.asset.service";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class NftCronService {
  private readonly logger: Logger;

  constructor(
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly nftAssetService: NftAssetService
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
        const needsProcessing = await this.nftWorkerService.needsProcessing(nft, new ProcessNftSettings());
        if (needsProcessing) {
          await this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings());
        }

        return needsProcessing;
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async triggerProcessWhitelistedNfts() {
    if (!this.apiConfigService.getIsProcessNftsFlagActive()) {
      return;
    }

    let lastProcessedTimestamp = await this.cachingService.getCache<number>(CacheInfo.LastProcessedTimestamp.key) ?? Math.floor(Date.now() / 1000);
    this.logger.log(`Last processed timestamp until now: ${lastProcessedTimestamp} (${new Date(lastProcessedTimestamp * 1000)})`);

    await Locker.lock('Process NFTs whitelisted', async () => {
      const nfts = await this.nftService.getNfts(new QueryPagination({ from: 0, size: 2500 }), new NftFilter({ isWhitelistedStorage: true, hasUris: true, before: lastProcessedTimestamp }));
      if (nfts.length === 0) {
        return;
      }

      const needProccessNfts: Nft[] = [];
      for (const nft of nfts) {
        if (!nft.media || nft.media.length === 0) {
          continue;
        }

        const isAssetUploaded = await this.nftAssetService.isAssetUploaded(nft.identifier, nft.media[0]);
        if (!isAssetUploaded) {
          needProccessNfts.push(nft);
        }

        // wait 0.05 seconds before another call
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      this.logger.log(`${needProccessNfts.length} that does not have asset uploaded in this batch`);

      await Promise.all(needProccessNfts.map((nft: Nft) => this.nftWorkerService.addProcessNftQueueJob(nft, new ProcessNftSettings({ uploadAsset: true }))));

      lastProcessedTimestamp = nfts[nfts.length - 1].timestamp ?? Math.floor(Date.now() / 1000);
    }, true);

    await this.cachingService.setCache(CacheInfo.LastProcessedTimestamp.key, lastProcessedTimestamp, CacheInfo.LastProcessedTimestamp.ttl);
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
