import { Injectable } from "@nestjs/common";
import { Histogram } from "prom-client";

@Injectable()
export class StatusMetricsService {
  private static totalAccountsHistogram: Histogram<string>;
  private static totalBlocksHistogram: Histogram<string>;
  private static totalCollectionsHistogram: Histogram<string>;
  private static totalNftsHistogram: Histogram<string>;
  private static totalTagsHistogram: Histogram<string>;
  private static totalRoundsHistogram: Histogram<string>;
  private static totalResultsHistogram: Histogram<string>;
  private static totalTokensHistogram: Histogram<string>;
  private static totalTransactionsHistogram: Histogram<string>;
  private static totalTransfersHistogram: Histogram<string>;
  private static totalShardRoundsHistogram: Histogram<string>;
  private static totalShardNoncesHistogram: Histogram<string>;

  constructor() {
    if (!StatusMetricsService.totalAccountsHistogram) {
      StatusMetricsService.totalAccountsHistogram = new Histogram({
        name: 'total_accounts',
        help: 'total_accounts',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.totalBlocksHistogram) {
      StatusMetricsService.totalBlocksHistogram = new Histogram({
        name: 'total_blocks',
        help: 'total_blocks',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.totalCollectionsHistogram) {
      StatusMetricsService.totalCollectionsHistogram = new Histogram({
        name: 'total_collections',
        help: 'total_collections',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.totalNftsHistogram) {
      StatusMetricsService.totalNftsHistogram = new Histogram({
        name: 'total_nfts',
        help: 'total_nfts',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.totalTagsHistogram) {
      StatusMetricsService.totalTagsHistogram = new Histogram({
        name: 'total_tags',
        help: 'total_tags',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.totalRoundsHistogram) {
      StatusMetricsService.totalRoundsHistogram = new Histogram({
        name: 'total_rounds',
        help: 'total_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.totalResultsHistogram) {
      StatusMetricsService.totalResultsHistogram = new Histogram({
        name: 'total_scResults',
        help: 'total_scResults',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.totalTokensHistogram) {
      StatusMetricsService.totalTokensHistogram = new Histogram({
        name: 'total_tokens',
        help: 'total_tokens',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.totalTransfersHistogram) {
      StatusMetricsService.totalTransfersHistogram = new Histogram({
        name: 'total_transfers',
        help: 'total_transfers',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.totalShardRoundsHistogram) {
      StatusMetricsService.totalShardRoundsHistogram = new Histogram({
        name: 'total_shard_rounds',
        help: 'Total shard rounds',
        labelNames: ['shard'],
        buckets: [],
      });
    }

    if (!StatusMetricsService.totalShardNoncesHistogram) {
      StatusMetricsService.totalShardNoncesHistogram = new Histogram({
        name: 'total_shard_nonces',
        help: 'Total shard nonces',
        labelNames: ['shard'],
        buckets: [],
      });
    }
  }

  setTotalAccounts(total: number) {
    StatusMetricsService.totalAccountsHistogram.labels().observe(total);
  }

  setTotalBlocks(total: number) {
    StatusMetricsService.totalBlocksHistogram.labels().observe(total);
  }

  setTotalCollections(total: number) {
    StatusMetricsService.totalCollectionsHistogram.labels().observe(total);
  }

  setTotalNfts(total: number) {
    StatusMetricsService.totalNftsHistogram.labels().observe(total);
  }

  setTotalTags(total: number) {
    StatusMetricsService.totalTagsHistogram.labels().observe(total);
  }

  setTotalRounds(total: number) {
    StatusMetricsService.totalRoundsHistogram.labels().observe(total);
  }

  setTotalResults(total: number) {
    StatusMetricsService.totalResultsHistogram.labels().observe(total);
  }

  setTotalTokens(total: number) {
    StatusMetricsService.totalTokensHistogram.labels().observe(total);
  }

  setTotalTransactions(total: number) {
    StatusMetricsService.totalTransactionsHistogram.labels().observe(total);
  }

  setTotalTransfers(total: number) {
    StatusMetricsService.totalTransfersHistogram.labels().observe(total);
  }

  setTotalShardRounds(shard: number, round: number) {
    StatusMetricsService.totalShardRoundsHistogram.labels(shard.toString()).observe(round);
  }

  setTotalShardNonces(shard: number, nonce: number) {
    StatusMetricsService.totalShardNoncesHistogram.labels(shard.toString()).observe(nonce);
  }
}
