import { Locker } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import AsyncLock from "async-lock";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { StatusMetricsService } from "src/common/metrics/status.metrics.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { IdentitiesService } from "src/endpoints/identities/identities.service";
import { MexFarmService } from "src/endpoints/mex/mex.farm.service";
import { MexPairService } from "src/endpoints/mex/mex.pair.service";
import { MexTokenService } from "src/endpoints/mex/mex.token.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ProviderService } from "src/endpoints/providers/provider.service";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { ShardService } from "src/endpoints/shards/shard.service";
import { TokenService } from "src/endpoints/tokens/token.service";
import { MexEconomicsService } from "src/endpoints/mex/mex.economics.service";
import { NetworkService } from "src/endpoints/network/network.service";

@Injectable()
export class StatusCheckerService {
  private readonly lock: AsyncLock;

  constructor(
    private readonly apiStatusMetricsService: StatusMetricsService,
    private readonly elasticIndexerService: ElasticIndexerService,
    private readonly tokenService: TokenService,
    private readonly protocolService: ProtocolService,
    private readonly gatewayService: GatewayService,
    private readonly identitiesService: IdentitiesService,
    private readonly nodeService: NodeService,
    private readonly providerService: ProviderService,
    private readonly shardService: ShardService,
    private readonly mexPairService: MexPairService,
    private readonly mexFarmService: MexFarmService,
    private readonly mexTokenService: MexTokenService,
    private readonly mexEconomicService: MexEconomicsService,
    private readonly economicService: NetworkService
  ) {
    this.lock = new AsyncLock();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAccountsCount() {
    await Locker.lock('Accounts Count', async () => {
      await this.lock.acquire('accounts', async () => {
        const count = await this.elasticIndexerService.getAccountsCount();
        this.apiStatusMetricsService.setTotalAccounts(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleBlocksCount() {
    await Locker.lock('Blocks Count', async () => {
      await this.lock.acquire('blocks', async () => {
        const count = await this.elasticIndexerService.getBlocksCount({});
        this.apiStatusMetricsService.setTotalBlocks(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCollectionsCount() {
    await Locker.lock('Collections Count', async () => {
      await this.lock.acquire('collections', async () => {
        const count = await this.elasticIndexerService.getNftCollectionCount({});
        this.apiStatusMetricsService.setTotalCollections(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNftsCount() {
    await Locker.lock('Nfts Count', async () => {
      await this.lock.acquire('nfts', async () => {
        const count = await this.elasticIndexerService.getNftCount({});
        this.apiStatusMetricsService.setTotalNfts(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTagsCount() {
    await Locker.lock('Tags Count', async () => {
      await this.lock.acquire('tags', async () => {
        const count = await this.elasticIndexerService.getNftTagCount();
        this.apiStatusMetricsService.setTotalTags(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleRoundsCount() {
    await Locker.lock('Rounds Count', async () => {
      await this.lock.acquire('rounds', async () => {
        const count = await this.elasticIndexerService.getRoundCount(new RoundFilter());
        this.apiStatusMetricsService.setTotalRounds(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleResultsCount() {
    await Locker.lock('Results Count', async () => {
      await this.lock.acquire('results', async () => {
        const count = await this.elasticIndexerService.getScResultsCount();
        this.apiStatusMetricsService.setTotalResults(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTokensCount() {
    await Locker.lock('Tokens Count', async () => {
      await this.lock.acquire('tokens', async () => {
        const count = await this.tokenService.getTokenCount({});
        this.apiStatusMetricsService.setTotalTokens(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTransactionsCount() {
    await Locker.lock('Transactions Count', async () => {
      await this.lock.acquire('transactions', async () => {
        const count = await this.elasticIndexerService.getTransactionCount({});
        this.apiStatusMetricsService.setTotalTransactions(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTransfersCount() {
    await Locker.lock('Transfers Count', async () => {
      await this.lock.acquire('transfers', async () => {
        const count = await this.elasticIndexerService.getTransfersCount({});
        this.apiStatusMetricsService.setTotalTransfers(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleIdentitiesCount() {
    await Locker.lock('Identities Count', async () => {
      await this.lock.acquire('identities', async () => {
        const count = await this.identitiesService.getAllIdentities();
        this.apiStatusMetricsService.setTotalIdentitiesResults(count.length);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNodesCount() {
    await Locker.lock('Nodes Count', async () => {
      await this.lock.acquire('nodes', async () => {
        const count = await this.nodeService.getAllNodes();
        this.apiStatusMetricsService.setTotalNodesResults(count.length);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleProvidersCount() {
    await Locker.lock('Providers Count', async () => {
      await this.lock.acquire('providers', async () => {
        const count = await this.providerService.getAllProviders();
        this.apiStatusMetricsService.setTotalProvidersResults(count.length);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleShardsCount() {
    await Locker.lock('Shards Count', async () => {
      await this.lock.acquire('shards', async () => {
        const count = await this.shardService.getAllShards();
        this.apiStatusMetricsService.setTotalShardsResults(count.length);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexPairsCount() {
    await Locker.lock('Mex Pairs Count', async () => {
      await this.lock.acquire('mexPairs', async () => {
        const count = await this.mexPairService.getMexPairsCount();
        this.apiStatusMetricsService.setTotalMexPairsResults(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexFarmsCount() {
    await Locker.lock('Mex Farms Count', async () => {
      await this.lock.acquire('mexFarms', async () => {
        const count = await this.mexFarmService.getMexFarmsCount();
        this.apiStatusMetricsService.setTotalMexFarmsResults(count);
      });
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexTokensCount() {
    await Locker.lock('Mex Tokens Count', async () => {
      await this.lock.acquire('mexTokens', async () => {
        const count = await this.mexTokenService.getMexTokensCount();
        this.apiStatusMetricsService.setTotalMexTokensResults(count);
      });
    }, true);
  }

  @Cron('*/6 * * * * *')
  async handleShardRoundsAndNonces() {
    await Locker.lock('Shard rounds and nonces', async () => {
      await this.lock.acquire('shard rounds and nonces', async () => {
        const shardIds = await this.protocolService.getShardIds();
        const roundsAndNonces = await Promise.all(shardIds.map(shardId => this.getCurrentRoundAndNonce(shardId)));
        for (const [shardId, round, nonce] of shardIds.zip(roundsAndNonces, (shardId, roundAndNonce) => [shardId, roundAndNonce.round, roundAndNonce.nonce])) {
          this.apiStatusMetricsService.setTotalShardRounds(shardId, round);
          this.apiStatusMetricsService.setTotalShardNonces(shardId, nonce);
        }
      });
    }, true);
  }

  @Cron('*/6 * * * * *')
  async handleMexEconomicValues() {
    await Locker.lock('MexEconomics values', async () => {
      await this.lock.acquire('MexEconomics values', async () => {
        const economics = await this.mexEconomicService.getMexEconomics();
        for (const [key, value] of Object.entries(economics)) {
          this.apiStatusMetricsService.setMexEconomicsValue(key, value);
        }
      });
    }, true);
  }

  @Cron('*/6 * * * * *')
  async handleEconomicValues() {
    await Locker.lock('Economics values', async () => {
      await this.lock.acquire('economics values', async () => {
        const economics = await this.economicService.getEconomics();
        for (const [key, value] of Object.entries(economics)) {
          this.apiStatusMetricsService.setEconomicsValue(key, value);
        }
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
}
