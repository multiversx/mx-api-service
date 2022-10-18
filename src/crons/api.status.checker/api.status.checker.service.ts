import { Locker } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import AsyncLock from "async-lock";
import { ApiStatusCheckerService } from "src/common/api-status-checker/api.status.checker.service";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { TokenService } from "src/endpoints/tokens/token.service";

@Injectable()
export class CronsApiStatusCheckerService {
  private readonly lock: AsyncLock;

  constructor(
    private readonly apiStatusMetricsService: ApiStatusCheckerService,
    private readonly elasticIndexerService: ElasticIndexerService,
    private readonly tokenService: TokenService,
  ) {
    this.lock = new AsyncLock();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAccountsCount() {
    await Locker.lock('Accounts Count', async () => {
      await this.lock.acquire('accounts', async () => {
        const count = await this.elasticIndexerService.getAccountsCount();
        this.apiStatusMetricsService.setAccountsCount(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleBlocksCount() {
    await Locker.lock('Blocks Count', async () => {
      await this.lock.acquire('blocks', async () => {
        const count = await this.elasticIndexerService.getBlocksCount({});
        this.apiStatusMetricsService.blocksCountHistogram(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCollectionsCount() {
    await Locker.lock('Collections Count', async () => {
      await this.lock.acquire('collections', async () => {
        const count = await this.elasticIndexerService.getNftCollectionCount({});
        this.apiStatusMetricsService.collectionsCountHistogram(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNftsCount() {
    await Locker.lock('Nfts Count', async () => {
      await this.lock.acquire('nfts', async () => {
        const count = await this.elasticIndexerService.getNftCount({});
        this.apiStatusMetricsService.nftsCountHistogram(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTagsCount() {
    await Locker.lock('Tags Count', async () => {
      await this.lock.acquire('tags', async () => {
        const count = await this.elasticIndexerService.getNftTagCount();
        this.apiStatusMetricsService.tagsCountHistogram(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleRoundsCount() {
    await Locker.lock('Rounds Count', async () => {
      await this.lock.acquire('rounds', async () => {
        const count = await this.elasticIndexerService.getRoundCount(new RoundFilter());
        this.apiStatusMetricsService.roundsCountHistogram(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleResultsCount() {
    await Locker.lock('Results Count', async () => {
      await this.lock.acquire('results', async () => {
        const count = await this.elasticIndexerService.getScResultsCount();
        this.apiStatusMetricsService.resultsCountHistogram(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTokensCount() {
    await Locker.lock('Tokens Count', async () => {
      await this.lock.acquire('tokens', async () => {
        const count = await this.tokenService.getTokenCount({});
        this.apiStatusMetricsService.tokensCountHistogram(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTransactionsCount() {
    await Locker.lock('Transactions Count', async () => {
      await this.lock.acquire('transactions', async () => {
        const count = await this.elasticIndexerService.getTransactionCount({});
        this.apiStatusMetricsService.transactionsCountHistogram(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTransfersCount() {
    await Locker.lock('Transfers Count', async () => {
      await this.lock.acquire('transfers', async () => {
        const count = await this.elasticIndexerService.getTransfersCount({});
        this.apiStatusMetricsService.transfersCountHistogram(count);
      });
    }, true);
  }

  @Cron('*/6 * * * * *')
  async handleShard_0_Rounds() {
    await Locker.lock('Shard_0 rounds', async () => {
      await this.lock.acquire('shard_0 rounds ', async () => {
        const round = await this.apiStatusMetricsService.getCurrentRound(0);
        this.apiStatusMetricsService.shard_0_RoundsHistogram(round);
      });
    }, true);
  }

  @Cron('*/6 * * * * *')
  async handleShard_1_Rounds() {
    await Locker.lock('Shard_1 rounds', async () => {
      await this.lock.acquire('shard_1 rounds ', async () => {
        const round = await this.apiStatusMetricsService.getCurrentRound(1);
        this.apiStatusMetricsService.shard_1_RoundsHistogram(round);
      });
    }, true);
  }

  @Cron('*/6 * * * * *')
  async handleShard_2_Rounds() {
    await Locker.lock('Shard_2 rounds', async () => {
      await this.lock.acquire('shard_2 rounds ', async () => {
        const round = await this.apiStatusMetricsService.getCurrentRound(2);
        this.apiStatusMetricsService.shard_2_RoundsHistogram(round);
      });
    }, true);
  }

  @Cron('*/6 * * * * *')
  async handleShard_metachain_Rounds() {
    await Locker.lock('Shard_metachain rounds', async () => {
      await this.lock.acquire('shard_metachain rounds ', async () => {
        const round = await this.apiStatusMetricsService.getCurrentRound(4294967295);
        this.apiStatusMetricsService.shard_metachain_RoundsHistogram(round);
      });
    }, true);
  }
}
