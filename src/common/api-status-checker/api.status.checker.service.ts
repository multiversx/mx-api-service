import { Injectable } from "@nestjs/common";
import { Histogram } from "prom-client";

@Injectable()
export class ApiStatusCheckerService {
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

  constructor() {
    if (!ApiStatusCheckerService.accountsCountHistogram) {
      ApiStatusCheckerService.accountsCountHistogram = new Histogram({
        name: 'total_accounts',
        help: 'total_accounts',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.blocksCountHistogram) {
      ApiStatusCheckerService.blocksCountHistogram = new Histogram({
        name: 'total_blocks',
        help: 'total_blocks',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.collectionsCountHistogram) {
      ApiStatusCheckerService.collectionsCountHistogram = new Histogram({
        name: 'total_collections',
        help: 'total_collections',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.nftsCountHistogram) {
      ApiStatusCheckerService.nftsCountHistogram = new Histogram({
        name: 'total_nfts',
        help: 'total_nfts',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.tagsCountHistogram) {
      ApiStatusCheckerService.tagsCountHistogram = new Histogram({
        name: 'total_tags',
        help: 'total_tags',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.roundsCountHistogram) {
      ApiStatusCheckerService.roundsCountHistogram = new Histogram({
        name: 'total_rounds',
        help: 'total_rounds',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.resultsCountHistogram) {
      ApiStatusCheckerService.resultsCountHistogram = new Histogram({
        name: 'total_scResults',
        help: 'total_scResults',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.tokensCountHistogram) {
      ApiStatusCheckerService.tokensCountHistogram = new Histogram({
        name: 'total_count',
        help: 'total_count',
        labelNames: [],
        buckets: [],
      });
    }

    if (!ApiStatusCheckerService.transferCountHistogram) {
      ApiStatusCheckerService.transferCountHistogram = new Histogram({
        name: 'total_transfers',
        help: 'total_transfers',
        labelNames: [],
        buckets: [],
      });
    }
  }

  setAccountsCount(count: number) {
    ApiStatusCheckerService.accountsCountHistogram.labels().observe(count);
  }

  blocksCountHistogram(count: number) {
    ApiStatusCheckerService.blocksCountHistogram.labels().observe(count);
  }

  collectionsCountHistogram(count: number) {
    ApiStatusCheckerService.collectionsCountHistogram.labels().observe(count);
  }

  nftsCountHistogram(count: number) {
    ApiStatusCheckerService.nftsCountHistogram.labels().observe(count);
  }

  tagsCountHistogram(count: number) {
    ApiStatusCheckerService.tagsCountHistogram.labels().observe(count);
  }

  roundsCountHistogram(count: number) {
    ApiStatusCheckerService.roundsCountHistogram.labels().observe(count);
  }

  resultsCountHistogram(count: number) {
    ApiStatusCheckerService.resultsCountHistogram.labels().observe(count);
  }

  tokensCountHistogram(count: number) {
    ApiStatusCheckerService.tokensCountHistogram.labels().observe(count);
  }

  transactionsCountHistogram(count: number) {
    ApiStatusCheckerService.transactionsCountHistogram.labels().observe(count);
  }

  transfersCountHistogram(count: number) {
    ApiStatusCheckerService.transferCountHistogram.labels().observe(count);
  }
}
