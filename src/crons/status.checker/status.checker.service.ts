import { Locker } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import AsyncLock from "async-lock";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { StatusMetricsService } from "src/common/metrics/status.metrics.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { TokenService } from "src/endpoints/tokens/token.service";

@Injectable()
export class StatusCheckerService {
  private readonly lock: AsyncLock;

  constructor(
    private readonly apiStatusMetricsService: StatusMetricsService,
    private readonly elasticIndexerService: ElasticIndexerService,
    private readonly tokenService: TokenService,
    private readonly protocolService: ProtocolService,
    private readonly gatewayService: GatewayService,
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

  async getCurrentRoundAndNonce(shardId: number): Promise<{ round: number, nonce: number }> {
    const result = await this.gatewayService.get(`network/status/${shardId}`, GatewayComponentRequest.networkStatus);
    return {
      round: result.status.erd_current_round,
      nonce: result.status.erd_nonce,
    };
  }

  @Cron('*/6 * * * * *')
  async handleShardRoundsAndNonces() {
    await Locker.lock('Shard rounds and nonces', async () => {
      await this.lock.acquire('shard rounds and nonces', async () => {
        const shardIds = await this.protocolService.getShardIds();
        const roundsAndNonces = await Promise.all(shardIds.map(shardId => this.getCurrentRoundAndNonce(shardId)));

        for (const [shardId, round, nonce] of shardIds.zip(roundsAndNonces, (shardId, roundAndNonce) => [shardId, roundAndNonce.round, roundAndNonce.nonce])) {
          this.apiStatusMetricsService.roundsHistogram(shardId, round);
          this.apiStatusMetricsService.noncesHistogram(shardId, nonce);
        }
      });
    }, true);
  }
}
