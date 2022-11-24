import { Locker, OriginLogger } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
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
import { QueryPagination } from "src/common/entities/query.pagination";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { NodeType } from "src/endpoints/nodes/entities/node.type";

@Injectable()
export class StatusCheckerService {
  private readonly logger = new OriginLogger(StatusCheckerService.name);

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
    private readonly economicService: NetworkService,
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAccountsCount() {
    await Locker.lock('Accounts Count', async () => {
      const count = await this.elasticIndexerService.getAccountsCount();
      this.apiStatusMetricsService.setTotalAccounts(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleBlocksCount() {
    await Locker.lock('Blocks Count', async () => {
      const count = await this.elasticIndexerService.getBlocksCount({});
      this.apiStatusMetricsService.setTotalBlocks(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCollectionsCount() {
    await Locker.lock('Collections Count', async () => {
      const count = await this.elasticIndexerService.getNftCollectionCount({});
      this.apiStatusMetricsService.setTotalCollections(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNftsCount() {
    await Locker.lock('Nfts Count', async () => {
      const count = await this.elasticIndexerService.getNftCount({});
      this.apiStatusMetricsService.setTotalNfts(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTagsCount() {
    await Locker.lock('Tags Count', async () => {
      const count = await this.elasticIndexerService.getNftTagCount();
      this.apiStatusMetricsService.setTotalTags(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleRoundsCount() {
    await Locker.lock('Rounds Count', async () => {
      const count = await this.elasticIndexerService.getRoundCount(new RoundFilter());
      this.apiStatusMetricsService.setTotalRounds(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleResultsCount() {
    await Locker.lock('Results Count', async () => {
      const count = await this.elasticIndexerService.getScResultsCount();
      this.apiStatusMetricsService.setTotalResults(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTokensCount() {
    await Locker.lock('Tokens Count', async () => {
      const count = await this.tokenService.getTokenCount({});
      this.apiStatusMetricsService.setTotalTokens(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTransactionsCount() {
    await Locker.lock('Transactions Count', async () => {
      const count = await this.elasticIndexerService.getTransactionCount({});
      this.apiStatusMetricsService.setTotalTransactions(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTransfersCount() {
    await Locker.lock('Transfers Count', async () => {
      const count = await this.elasticIndexerService.getTransfersCount({});
      this.apiStatusMetricsService.setTotalTransfers(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleIdentitiesCount() {
    await Locker.lock('Identities Count', async () => {
      const count = await this.identitiesService.getAllIdentities();
      this.apiStatusMetricsService.setTotalIdentities(count.length);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNodesCount() {
    await Locker.lock('Nodes Count', async () => {
      const count = await this.nodeService.getAllNodes();
      this.apiStatusMetricsService.setTotalNodes(count.length);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleProvidersCount() {
    await Locker.lock('Providers Count', async () => {
      const count = await this.providerService.getAllProviders();
      this.apiStatusMetricsService.setTotalProviders(count.length);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleShardsCount() {
    await Locker.lock('Shards Count', async () => {
      const count = await this.shardService.getAllShards();
      this.apiStatusMetricsService.setTotalShards(count.length);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexPairsCount() {
    await Locker.lock('Mex Pairs Count', async () => {
      const count = await this.mexPairService.getMexPairsCount();
      this.apiStatusMetricsService.setTotalMexPairs(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexFarmsCount() {
    await Locker.lock('Mex Farms Count', async () => {
      const count = await this.mexFarmService.getMexFarmsCount();
      this.apiStatusMetricsService.setTotalMexFarms(count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexTokensCount() {
    await Locker.lock('Mex Tokens Count', async () => {
      const count = await this.mexTokenService.getMexTokensCount();
      this.apiStatusMetricsService.setTotalMexTokens(count);
    }, true);
  }

  @Cron('*/6 * * * * *')
  async handleShardRoundsAndNonces() {
    await Locker.lock('Shard rounds and nonces', async () => {
      const shardIds = await this.protocolService.getShardIds();
      const roundsAndNonces = await Promise.all(shardIds.map(shardId => this.getCurrentRoundAndNonce(shardId)));
      for (const [shardId, round, nonce] of shardIds.zip(roundsAndNonces, (shardId, roundAndNonce) => [shardId, roundAndNonce.round, roundAndNonce.nonce])) {
        this.apiStatusMetricsService.setTotalShardRounds(shardId, round);
        this.apiStatusMetricsService.setTotalShardNonces(shardId, nonce);
      }
    }, true);
  }

  @Cron('*/6 * * * * *')
  async handleMexEconomicValues() {
    await Locker.lock('MexEconomics values', async () => {
      const economics = await this.mexEconomicService.getMexEconomics();
      for (const [key, value] of Object.entries(economics)) {
        this.apiStatusMetricsService.setMexEconomicsValue(key, value);
      }
    }, true);
  }

  @Cron('*/6 * * * * *')
  async handleEconomicValues() {
    await Locker.lock('Economics values', async () => {
      const economics = await this.economicService.getEconomics();
      for (const [key, value] of Object.entries(economics)) {
        this.apiStatusMetricsService.setEconomicsValue(key, value);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTokenCount() {
    await Locker.lock('Check token count', async () => {
      const tokenCount = await this.tokenService.getTokenCount({});
      if (tokenCount > 1500) {
        this.apiStatusMetricsService.setCheckTokenCountResult('success');
      } else {
        this.logger.error(`Invalid token count '${tokenCount}'`);
        this.apiStatusMetricsService.setCheckTokenCountResult('error');
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkProviderCount() {
    await Locker.lock('Check provider count', async () => {
      const providers = await this.providerService.getAllProviders();
      if (providers.length > 130) {
        this.apiStatusMetricsService.setCheckProviderCountResult('success');
      } else {
        this.logger.error(`Invalid provider count '${providers.length}'`);
        this.apiStatusMetricsService.setCheckProviderCountResult('error');
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkTokenSupply() {
    await Locker.lock('Check token supply', async () => {
      const tokens = await this.tokenService.getTokens(new QueryPagination({ size: 1000 }), new TokenFilter());

      const tokensWithSupply = tokens.filter(token => token.supply);
      if (tokensWithSupply.length > 50) {
        this.apiStatusMetricsService.setCheckTokenSupplyResult('success');
      } else {
        this.logger.error(`Invalid token with supply count '${tokensWithSupply.length}'`);
        this.apiStatusMetricsService.setCheckTokenSupplyResult('error');
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTokenAssets() {
    await Locker.lock('Check token assets', async () => {
      const tokens = await this.tokenService.getTokens(new QueryPagination({ size: 1000 }), new TokenFilter());

      const tokensWithAssets = tokens.filter(token => token.assets);
      if (tokensWithAssets.length > 100) {
        this.apiStatusMetricsService.setCheckTokenAssetsResult('success');
      } else {
        this.logger.error(`Invalid token with assets count '${tokensWithAssets.length}'`);
        this.apiStatusMetricsService.setCheckTokenAssetsResult('error');
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTokenAccounts() {
    await Locker.lock('Check token accounts', async () => {
      const tokens = await this.tokenService.getTokens(new QueryPagination({ size: 1000 }), new TokenFilter());

      const tokensWithAccounts = tokens.filter(token => token.accounts);
      if (tokensWithAccounts.length > 990) {
        this.apiStatusMetricsService.setCheckTokenAccountsResult('success');
      } else {
        this.logger.error(`Invalid token with accounts count '${tokensWithAccounts.length}'`);
        this.apiStatusMetricsService.setCheckTokenAccountsResult('error');
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTokenTransactions() {
    await Locker.lock('Check token transactions', async () => {
      const tokens = await this.tokenService.getTokens(new QueryPagination({ size: 1000 }), new TokenFilter());

      const tokensWithTransactions = tokens.filter(token => token.transactions);
      if (tokensWithTransactions.length >= 900) {
        this.apiStatusMetricsService.setCheckTokenTransactionsResult('success');
      } else {
        this.logger.error(`Invalid token with transactions count '${tokensWithTransactions.length}'`);
        this.apiStatusMetricsService.setCheckTokenTransactionsResult('error');
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkValidatorNodeCount() {
    await Locker.lock('Check validator node count ', async () => {
      const nodes = await this.nodeService.getAllNodes();

      const validators = nodes.filter(node => node.type === NodeType.validator);
      if (validators.length >= 3280) {
        this.apiStatusMetricsService.setCheckValidatorNodeCountResult('success');
      } else {
        this.logger.error(`Invalid validator count '${validators.length}'`);
        this.apiStatusMetricsService.setCheckValidatorNodeCountResult('error');
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkIdentityNames() {
    await Locker.lock('Check identity names', async () => {
      const identities = await this.identitiesService.getAllIdentities();

      const success = identities.slice(0, 50).every(x => x.name);
      if (success) {
        this.apiStatusMetricsService.setCheckIdentityNamesResult('success');
      } else {
        this.apiStatusMetricsService.setCheckIdentityNamesResult('error');
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkIdentities() {
    await Locker.lock('Check identities', async () => {
      const identities = await this.identitiesService.getAllIdentities();

      const success = identities.slice(0, 50).every(identity => identity.identity);
      if (success) {
        this.apiStatusMetricsService.setCheckIdentitiesResult('success');
      } else {
        this.apiStatusMetricsService.setCheckIdentitiesResult('error');
      }
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
