import { Injectable } from "@nestjs/common";
import { Histogram } from "prom-client";

@Injectable()
export class StatusMetricsService {
  private static accountsCountHistogram: Histogram<string>;
  private static blocksCountHistogram: Histogram<string>;
  private static collectionsCountHistogram: Histogram<string>;
  private static nftsCountHistogram: Histogram<string>;
  private static tagsCountHistogram: Histogram<string>;
  private static roundsCountHistogram: Histogram<string>;
  private static resultsCountHistogram: Histogram<string>;
  private static tokensCountHistogram: Histogram<string>;
  private static transactionsCountHistogram: Histogram<string>;
  private static transferCountHistogram: Histogram<string>;
  private static shardRoundsHistogram: Histogram<string>;

  constructor() {
    if (!StatusMetricsService.accountsCountHistogram) {
      StatusMetricsService.accountsCountHistogram = new Histogram({
        name: 'total_accounts',
        help: 'total_accounts',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.blocksCountHistogram) {
      StatusMetricsService.blocksCountHistogram = new Histogram({
        name: 'total_blocks',
        help: 'total_blocks',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.collectionsCountHistogram) {
      StatusMetricsService.collectionsCountHistogram = new Histogram({
        name: 'total_collections',
        help: 'total_collections',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.nftsCountHistogram) {
      StatusMetricsService.nftsCountHistogram = new Histogram({
        name: 'total_nfts',
        help: 'total_nfts',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.tagsCountHistogram) {
      StatusMetricsService.tagsCountHistogram = new Histogram({
        name: 'total_tags',
        help: 'total_tags',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.roundsCountHistogram) {
      StatusMetricsService.roundsCountHistogram = new Histogram({
        name: 'total_rounds',
        help: 'total_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.resultsCountHistogram) {
      StatusMetricsService.resultsCountHistogram = new Histogram({
        name: 'total_scResults',
        help: 'total_scResults',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.tokensCountHistogram) {
      StatusMetricsService.tokensCountHistogram = new Histogram({
        name: 'total_tokens',
        help: 'total_tokens',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.transferCountHistogram) {
      StatusMetricsService.transferCountHistogram = new Histogram({
        name: 'total_transfers',
        help: 'total_transfers',
        labelNames: [],
        buckets: [],
      });
    }

    if (!StatusMetricsService.shardRoundsHistogram) {
      StatusMetricsService.shardRoundsHistogram = new Histogram({
        name: 'total_shard_rounds',
        help: 'Total shard rounds',
        labelNames: ['shard'],
        buckets: [],
      });
    }
  }

  setAccountsCount(count: number) {
    StatusMetricsService.accountsCountHistogram.labels().observe(count);
  }

  blocksCountHistogram(count: number) {
    StatusMetricsService.blocksCountHistogram.labels().observe(count);
  }

  collectionsCountHistogram(count: number) {
    StatusMetricsService.collectionsCountHistogram.labels().observe(count);
  }

  nftsCountHistogram(count: number) {
    StatusMetricsService.nftsCountHistogram.labels().observe(count);
  }

  tagsCountHistogram(count: number) {
    StatusMetricsService.tagsCountHistogram.labels().observe(count);
  }

  roundsCountHistogram(count: number) {
    StatusMetricsService.roundsCountHistogram.labels().observe(count);
  }

  resultsCountHistogram(count: number) {
    StatusMetricsService.resultsCountHistogram.labels().observe(count);
  }

  tokensCountHistogram(count: number) {
    StatusMetricsService.tokensCountHistogram.labels().observe(count);
  }

  transactionsCountHistogram(count: number) {
    StatusMetricsService.transactionsCountHistogram.labels().observe(count);
  }

  transfersCountHistogram(count: number) {
    StatusMetricsService.transferCountHistogram.labels().observe(count);
  }

  roundsHistogram(shard: number, round: number) {
    StatusMetricsService.shardRoundsHistogram.labels(shard.toString()).observe(round);
  }
}
