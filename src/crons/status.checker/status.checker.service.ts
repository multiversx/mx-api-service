import { Locker, OriginLogger } from '@multiversx/sdk-nestjs-common';
import { MetricsService } from '@multiversx/sdk-nestjs-monitoring';
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
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
import { AccountQueryOptions } from "src/endpoints/accounts/entities/account.query.options";
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { StatusCheckerThresholds } from 'src/common/api-config/entities/status-checker-thresholds';
import { SmartContractResultFilter } from 'src/endpoints/sc-results/entities/smart.contract.result.filter';

@Injectable()
export class StatusCheckerService {
  private readonly logger = new OriginLogger(StatusCheckerService.name);

  constructor(
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
    private readonly apiConfigService: ApiConfigService
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAccountsCount() {
    await Locker.lock('Status Checker: Accounts Count', async () => {
      const count = await this.elasticIndexerService.getAccountsCount(new AccountQueryOptions());
      MetricsService.setClusterComparisonValue('total_accounts', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleBlocksCount() {
    await Locker.lock('Status Checker: Blocks Count', async () => {
      const count = await this.elasticIndexerService.getBlocksCount({});
      MetricsService.setClusterComparisonValue('total_blocks', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCollectionsCount() {
    await Locker.lock('Status Checker: Collections Count', async () => {
      const count = await this.elasticIndexerService.getNftCollectionCount({});
      MetricsService.setClusterComparisonValue('total_collections', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNftsCount() {
    await Locker.lock('Status Checker: Nfts Count', async () => {
      const count = await this.elasticIndexerService.getNftCount({});
      MetricsService.setClusterComparisonValue('total_nfts', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTagsCount() {
    await Locker.lock('Status Checker: Tags Count', async () => {
      const count = await this.elasticIndexerService.getNftTagCount();
      MetricsService.setClusterComparisonValue('total_tags', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleRoundsCount() {
    await Locker.lock('Status Checker: Rounds Count', async () => {
      const count = await this.elasticIndexerService.getRoundCount(new RoundFilter());
      MetricsService.setClusterComparisonValue('total_rounds', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleResultsCount() {
    await Locker.lock('Status Checker: Results Count', async () => {
      const count = await this.elasticIndexerService.getScResultsCount(new SmartContractResultFilter());
      MetricsService.setClusterComparisonValue('total_results', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTokensCount() {
    await Locker.lock('Status Checker: Tokens Count', async () => {
      const count = await this.tokenService.getTokenCount({});
      MetricsService.setClusterComparisonValue('total_tokens', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTransactionsCount() {
    await Locker.lock('Status Checker: Transactions Count', async () => {
      const count = await this.elasticIndexerService.getTransactionCount({});
      MetricsService.setClusterComparisonValue('total_transactions', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTransfersCount() {
    await Locker.lock('Status Checker: Transfers Count', async () => {
      const count = await this.elasticIndexerService.getTransfersCount({});
      MetricsService.setClusterComparisonValue('total_transfers', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleIdentitiesCount() {
    await Locker.lock('Status Checker: Identities Count', async () => {
      const identities = await this.identitiesService.getAllIdentities();
      MetricsService.setClusterComparisonValue('total_identities', identities.length);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleNodesCount() {
    await Locker.lock('Status Checker: Nodes Count', async () => {
      const nodes = await this.nodeService.getAllNodes();
      MetricsService.setClusterComparisonValue('total_nodes', nodes.length);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleProvidersCount() {
    await Locker.lock('Status Checker: Providers Count', async () => {
      const providers = await this.providerService.getAllProviders();
      MetricsService.setClusterComparisonValue('total_providers', providers.length);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleShardsCount() {
    await Locker.lock('Status Checker: Shards Count', async () => {
      const shards = await this.shardService.getAllShards();
      MetricsService.setClusterComparisonValue('total_shards', shards.length);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexPairsCount() {
    await Locker.lock('Status Checker: Mex Pairs Count', async () => {
      const count = await this.mexPairService.getMexPairsCount();
      MetricsService.setClusterComparisonValue('total_mex_pairs', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexFarmsCount() {
    await Locker.lock('Status Checker: Mex Farms Count', async () => {
      const count = await this.mexFarmService.getMexFarmsCount();
      MetricsService.setClusterComparisonValue('total_mex_farms', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexTokensCount() {
    await Locker.lock('Status Checker: Mex Tokens Count', async () => {
      const count = await this.mexTokenService.getMexTokensCount();
      MetricsService.setClusterComparisonValue('total_mex_tokens', count);
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleShardRoundsAndNonces() {
    await Locker.lock('Status Checker: Shard rounds and nonces', async () => {
      const shardIds = await this.protocolService.getShardIds();
      const roundsAndNonces = await Promise.all(shardIds.map(shardId => this.getCurrentRoundAndNonce(shardId)));
      for (const [shardId, round, nonce] of shardIds.zip(roundsAndNonces, (shardId, roundAndNonce) => [shardId, roundAndNonce.round, roundAndNonce.nonce])) {
        MetricsService.setClusterComparisonValue(`total_shard_rounds_${shardId}`, round);
        MetricsService.setClusterComparisonValue(`total_shard_nonces_${shardId}`, nonce);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleMexEconomicValues() {
    await Locker.lock('Status Checker: Store Mex economics metrics', async () => {
      const economics = await this.mexEconomicService.getMexEconomics();
      for (const [key, value] of Object.entries(economics)) {
        MetricsService.setClusterComparisonValue(`mex_economics_${key}`, value);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleEconomicValues() {
    await Locker.lock('Status Checker: Store Economics metrics', async () => {
      const economics = await this.economicService.getEconomics();
      for (const [key, value] of Object.entries(economics)) {
        MetricsService.setClusterComparisonValue(`economics_${key}`, value);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkTokenCount() {
    await Locker.lock('Status Checker: Check token count', async () => {
      const tokenCount = await this.tokenService.getTokenCount({});
      if (tokenCount > this.getStatusCheckerThresholds().tokens) {
        MetricsService.setClusterComparisonValue(`check_token_count:success`, 1);
      } else {
        this.logger.error(`Invalid token count '${tokenCount}'`);
        MetricsService.setClusterComparisonValue(`check_token_count:error`, 1);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkNodeCount() {
    await Locker.lock('Status Checker: Check node count', async () => {
      const allNodes = await this.nodeService.getAllNodes();
      if (allNodes.length > this.getStatusCheckerThresholds().nodes) {
        MetricsService.setClusterComparisonValue(`check_node_count:success`, 1);
      } else {
        this.logger.error(`Invalid node count '${allNodes.length}'`);
        MetricsService.setClusterComparisonValue(`check_node_count:error`, 1);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkProviderCount() {
    await Locker.lock('Status Checker: Check provider count', async () => {
      const providers = await this.providerService.getAllProviders();
      if (providers.length > this.getStatusCheckerThresholds().providers) {
        MetricsService.setClusterComparisonValue(`check_provider_count:success`, 1);
      } else {
        MetricsService.setClusterComparisonValue(`check_provider_count:error`, 1);
        this.logger.error(`Invalid provider count '${providers.length}'`);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTokenSupply() {
    await Locker.lock('Status Checker: Check token supply', async () => {
      const tokens = await this.tokenService.getTokens(new QueryPagination({ size: 1000 }), new TokenFilter());

      const tokensWithSupply = tokens.filter(token => token.supply);
      if (tokensWithSupply.length > this.getStatusCheckerThresholds().tokenSupplyCount) {
        MetricsService.setClusterComparisonValue(`check_token_supply:success`, 1);
      } else {
        MetricsService.setClusterComparisonValue(`check_token_supply:error`, 1);
        this.logger.error(`Invalid token with supply count '${tokensWithSupply.length}'`);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTokenAssets() {
    await Locker.lock('Status Checker: Check token assets', async () => {
      const tokens = await this.tokenService.getTokens(new QueryPagination({ size: 1000 }), new TokenFilter());

      const tokensWithAssets = tokens.filter(token => token.assets);
      if (tokensWithAssets.length > this.getStatusCheckerThresholds().tokenAssets) {
        MetricsService.setClusterComparisonValue(`check_token_assets:success`, 1);
      } else {
        MetricsService.setClusterComparisonValue(`check_token_assets:error`, 1);

        this.logger.error(`Invalid token with assets count '${tokensWithAssets.length}'`);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTokenAccounts() {
    await Locker.lock('Status Checker: Check token accounts', async () => {
      const tokens = await this.tokenService.getTokens(new QueryPagination({ size: 1000 }), new TokenFilter());

      const tokensWithAccounts = tokens.filter(token => token.accounts);
      if (tokensWithAccounts.length > this.getStatusCheckerThresholds().tokenAccounts) {
        MetricsService.setClusterComparisonValue(`check_token_accounts:success`, 1);
      } else {
        MetricsService.setClusterComparisonValue(`check_token_accounts:error`, 1);

        this.logger.error(`Invalid token with accounts count '${tokensWithAccounts.length}'`);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkTokenTransactions() {
    await Locker.lock('Status Checker: Check token transactions', async () => {
      const tokens = await this.tokenService.getTokens(new QueryPagination({ size: 1000 }), new TokenFilter());

      const tokensWithTransactions = tokens.filter(token => token.transactions);
      if (tokensWithTransactions.length >= this.getStatusCheckerThresholds().tokenTransactions) {
        MetricsService.setClusterComparisonValue(`check_token_transactions:success`, 1);
      } else {
        MetricsService.setClusterComparisonValue(`check_token_transactions:error`, 1);

        this.logger.error(`Invalid token with transactions count '${tokensWithTransactions.length}'`);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkValidatorNodeCount() {
    await Locker.lock('Status Checker: Check validator node count ', async () => {
      const nodes = await this.nodeService.getAllNodes();

      const validators = nodes.filter(node => node.type === NodeType.validator);
      if (validators.length >= this.getStatusCheckerThresholds().nodeValidators) {
        MetricsService.setClusterComparisonValue(`check_validator_node_count:success`, 1);
      } else {
        MetricsService.setClusterComparisonValue(`check_validator_node_count:error`, 1);

        this.logger.error(`Invalid validator count '${validators.length}'`);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkIdentityNames() {
    await Locker.lock('Status Checker: Check identity names', async () => {
      const identities = await this.identitiesService.getAllIdentities();

      const success = identities.slice(0, 50).every(x => x.name);
      if (success) {
        MetricsService.setClusterComparisonValue(`check_identity_names:success`, 1);
      } else {
        MetricsService.setClusterComparisonValue(`check_identity_names:error`, 1);
      }
    }, true);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkIdentities() {
    await Locker.lock('Status Checker: Check identities', async () => {
      const identities = await this.identitiesService.getAllIdentities();

      const success = identities.slice(0, 50).every(identity => identity.identity);
      if (success) {
        MetricsService.setClusterComparisonValue(`check_identities:success`, 1);
      } else {
        MetricsService.setClusterComparisonValue(`check_identities:error`, 1);
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

  private getStatusCheckerThresholds(): StatusCheckerThresholds {
    const thresholds = this.apiConfigService.getStatusCheckerThresholds();
    if (!thresholds) {
      return this.getDefaultStatusCheckerThresholds();
    }

    return new StatusCheckerThresholds(thresholds);
  }

  private getDefaultStatusCheckerThresholds(): StatusCheckerThresholds {
    const network = this.apiConfigService.getNetwork();
    switch (network) {
      case 'devnet':
        return new StatusCheckerThresholds({
          tokens: 500,
          nodes: 3000,
          providers: 10,
          tokenSupplyCount: 20,
          tokenAssets: 20,
          tokenAccounts: 500,
          tokenTransactions: 500,
          nodeValidators: 300,
        });
      case 'testnet':
        return new StatusCheckerThresholds({
          tokens: 100,
          nodes: 300,
          providers: 30,
          tokenSupplyCount: 1,
          tokenAssets: 1,
          tokenAccounts: 200,
          tokenTransactions: 100,
          nodeValidators: 3500,
        });
      case 'mainnet':
        return new StatusCheckerThresholds({
          tokens: 1000,
          nodes: 5000,
          providers: 150,
          tokenSupplyCount: 100,
          tokenAssets: 100,
          tokenAccounts: 1000,
          tokenTransactions: 1000,
          nodeValidators: 3260,
        });
      default:
        throw new Error(`Invalid network '${network}'`);
    }
  }
}
