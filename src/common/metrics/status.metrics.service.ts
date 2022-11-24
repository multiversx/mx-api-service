import { Injectable } from "@nestjs/common";
import { Gauge } from "prom-client";

@Injectable()
export class StatusMetricsService {
  private static totalAccountsMetric: Gauge<string>;
  private static totalBlocksMetric: Gauge<string>;
  private static totalCollectionsMetric: Gauge<string>;
  private static totalNftsMetric: Gauge<string>;
  private static totalTagsMetric: Gauge<string>;
  private static totalRoundsMetric: Gauge<string>;
  private static totalResultsMetric: Gauge<string>;
  private static totalTokensMetric: Gauge<string>;
  private static totalTransactionsMetric: Gauge<string>;
  private static totalTransfersMetric: Gauge<string>;
  private static totalShardRoundsMetric: Gauge<string>;
  private static totalShardNoncesMetric: Gauge<string>;
  private static totalIdentitiesMetric: Gauge<string>;
  private static totalNodesMetric: Gauge<string>;
  private static totalProvidersMetric: Gauge<string>;
  private static totalShardsMetric: Gauge<string>;
  private static totalMexPairsMetric: Gauge<string>;
  private static totalMexFarmsMetric: Gauge<string>;
  private static totalMexTokensMetric: Gauge<string>;
  private static checkMexEconomicsMetric: Gauge<string>;
  private static checkEconomicsMetric: Gauge<string>;
  private static checkTokenCountMetric: Gauge<string>;
  private static checkNodeCountMetric: Gauge<string>;
  private static checkProviderCountMetric: Gauge<string>;
  private static checkTokenSupplyMetric: Gauge<string>;
  private static checkTokenAssetsMetric: Gauge<string>;
  private static checkTokenAccountsMetric: Gauge<string>;
  private static checkTokenTransactionsMetric: Gauge<string>;
  private static checkValidatorNodeCountMetric: Gauge<string>;
  private static checkIdentityNamesMetric: Gauge<string>;
  private static checkIdentitiesMetric: Gauge<string>;

  constructor() {
    if (!StatusMetricsService.totalAccountsMetric) {
      StatusMetricsService.totalAccountsMetric = new Gauge({
        name: 'total_accounts',
        help: 'total_accounts',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalBlocksMetric) {
      StatusMetricsService.totalBlocksMetric = new Gauge({
        name: 'total_blocks',
        help: 'total_blocks',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalCollectionsMetric) {
      StatusMetricsService.totalCollectionsMetric = new Gauge({
        name: 'total_collections',
        help: 'total_collections',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalNftsMetric) {
      StatusMetricsService.totalNftsMetric = new Gauge({
        name: 'total_nfts',
        help: 'total_nfts',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalTagsMetric) {
      StatusMetricsService.totalTagsMetric = new Gauge({
        name: 'total_tags',
        help: 'total_tags',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalRoundsMetric) {
      StatusMetricsService.totalRoundsMetric = new Gauge({
        name: 'total_rounds',
        help: 'total_rounds',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalResultsMetric) {
      StatusMetricsService.totalResultsMetric = new Gauge({
        name: 'total_scResults',
        help: 'total_scResults',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalTokensMetric) {
      StatusMetricsService.totalTokensMetric = new Gauge({
        name: 'total_tokens',
        help: 'total_tokens',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalTransactionsMetric) {
      StatusMetricsService.totalTransactionsMetric = new Gauge({
        name: 'total_transactions',
        help: 'total_transactions',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalTransfersMetric) {
      StatusMetricsService.totalTransfersMetric = new Gauge({
        name: 'total_transfers',
        help: 'total_transfers',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalShardRoundsMetric) {
      StatusMetricsService.totalShardRoundsMetric = new Gauge({
        name: 'total_shard_rounds',
        help: 'total shard rounds',
        labelNames: ['shard'],
      });
    }

    if (!StatusMetricsService.totalShardNoncesMetric) {
      StatusMetricsService.totalShardNoncesMetric = new Gauge({
        name: 'total_shard_nonces',
        help: 'total_shard_nonces',
        labelNames: ['shard'],
      });
    }

    if (!StatusMetricsService.totalIdentitiesMetric) {
      StatusMetricsService.totalIdentitiesMetric = new Gauge({
        name: 'total_identities',
        help: 'total_identities',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalNodesMetric) {
      StatusMetricsService.totalNodesMetric = new Gauge({
        name: 'total_nodes',
        help: 'total_nodes',
        labelNames: [],
      });
    }


    if (!StatusMetricsService.totalProvidersMetric) {
      StatusMetricsService.totalProvidersMetric = new Gauge({
        name: 'total_providers',
        help: 'total_providers',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalShardsMetric) {
      StatusMetricsService.totalShardsMetric = new Gauge({
        name: 'total_shards',
        help: 'total_shards',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalMexPairsMetric) {
      StatusMetricsService.totalMexPairsMetric = new Gauge({
        name: 'total_mexPairs',
        help: 'total_mexPairs',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalMexFarmsMetric) {
      StatusMetricsService.totalMexFarmsMetric = new Gauge({
        name: 'total_mexFarms',
        help: 'total_mexFarms',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.totalMexTokensMetric) {
      StatusMetricsService.totalMexTokensMetric = new Gauge({
        name: 'total_mexTokens',
        help: 'total_mexTokens',
        labelNames: [],
      });
    }

    if (!StatusMetricsService.checkMexEconomicsMetric) {
      StatusMetricsService.checkMexEconomicsMetric = new Gauge({
        name: 'check_mex_economics',
        help: 'check_mex_economics',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkEconomicsMetric) {
      StatusMetricsService.checkEconomicsMetric = new Gauge({
        name: 'check_economics',
        help: 'check_economics',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkTokenCountMetric) {
      StatusMetricsService.checkTokenCountMetric = new Gauge({
        name: 'check_token_count',
        help: 'check_token_count',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkNodeCountMetric) {
      StatusMetricsService.checkNodeCountMetric = new Gauge({
        name: 'check_node_count',
        help: 'check_node_count',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkProviderCountMetric) {
      StatusMetricsService.checkProviderCountMetric = new Gauge({
        name: 'check_provider_count',
        help: 'check_provider_count',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkTokenSupplyMetric) {
      StatusMetricsService.checkTokenSupplyMetric = new Gauge({
        name: 'check_token_supply',
        help: 'check_token_supply',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkTokenAssetsMetric) {
      StatusMetricsService.checkTokenAssetsMetric = new Gauge({
        name: 'check_token_assets',
        help: 'check_token_assets',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkTokenAccountsMetric) {
      StatusMetricsService.checkTokenAccountsMetric = new Gauge({
        name: 'check_token_accounts',
        help: 'check_token_accounts',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkTokenTransactionsMetric) {
      StatusMetricsService.checkTokenTransactionsMetric = new Gauge({
        name: 'check_token_transactions',
        help: 'check_token_transactions',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkValidatorNodeCountMetric) {
      StatusMetricsService.checkValidatorNodeCountMetric = new Gauge({
        name: 'check_validator_node_count',
        help: 'check_validator_node_count',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkIdentityNamesMetric) {
      StatusMetricsService.checkIdentityNamesMetric = new Gauge({
        name: 'check_identity_names',
        help: 'check_identity_names',
        labelNames: ['result'],
      });
    }

    if (!StatusMetricsService.checkIdentitiesMetric) {
      StatusMetricsService.checkIdentitiesMetric = new Gauge({
        name: 'check_identities',
        help: 'check_identities',
        labelNames: ['result'],
      });
    }
  }

  setTotalAccounts(total: number) {
    StatusMetricsService.totalAccountsMetric.set(total);
  }

  setTotalBlocks(total: number) {
    StatusMetricsService.totalBlocksMetric.set(total);
  }

  setTotalCollections(total: number) {
    StatusMetricsService.totalCollectionsMetric.set(total);
  }

  setTotalNfts(total: number) {
    StatusMetricsService.totalNftsMetric.set(total);
  }

  setTotalTags(total: number) {
    StatusMetricsService.totalTagsMetric.set(total);
  }

  setTotalRounds(total: number) {
    StatusMetricsService.totalRoundsMetric.set(total);
  }

  setTotalResults(total: number) {
    StatusMetricsService.totalResultsMetric.set(total);
  }

  setTotalTokens(total: number) {
    StatusMetricsService.totalTokensMetric.set(total);
  }

  setTotalTransactions(total: number) {
    StatusMetricsService.totalTransactionsMetric.set(total);
  }

  setTotalTransfers(total: number) {
    StatusMetricsService.totalTransfersMetric.set(total);
  }

  setTotalShardRounds(shard: number, round: number) {
    StatusMetricsService.totalShardRoundsMetric.labels(shard.toString()).set(round);
  }

  setTotalShardNonces(shard: number, nonce: number) {
    StatusMetricsService.totalShardNoncesMetric.labels(shard.toString()).set(nonce);
  }

  setTotalIdentities(total: number) {
    StatusMetricsService.totalIdentitiesMetric.set(total);
  }

  setTotalNodes(total: number) {
    StatusMetricsService.totalNodesMetric.set(total);
  }

  setTotalProviders(total: number) {
    StatusMetricsService.totalProvidersMetric.set(total);
  }

  setTotalShards(total: number) {
    StatusMetricsService.totalShardsMetric.set(total);
  }

  setTotalMexPairs(total: number) {
    StatusMetricsService.totalMexPairsMetric.set(total);
  }

  setTotalMexFarms(total: number) {
    StatusMetricsService.totalMexFarmsMetric.set(total);
  }

  setTotalMexTokens(total: number) {
    StatusMetricsService.totalMexTokensMetric.set(total);
  }

  setMexEconomicsValue(name: string, value: number) {
    StatusMetricsService.checkMexEconomicsMetric.labels(name.toString()).set(value);
  }

  setEconomicsValue(name: string, value: number) {
    StatusMetricsService.checkEconomicsMetric.labels(name.toString()).set(value);
  }

  setCheckTokenCountResult(result: 'success' | 'error') {
    StatusMetricsService.checkTokenCountMetric.labels(result).inc();
  }

  setCheckProviderCountResult(result: 'success' | 'error') {
    StatusMetricsService.checkProviderCountMetric.labels(result).inc();
  }

  setCheckTokenSupplyResult(result: 'success' | 'error') {
    StatusMetricsService.checkTokenSupplyMetric.labels(result).inc();
  }

  setCheckTokenAssetsResult(result: 'success' | 'error') {
    StatusMetricsService.checkTokenAssetsMetric.labels(result).inc();
  }

  setCheckTokenAccountsResult(result: 'success' | 'error') {
    StatusMetricsService.checkTokenAccountsMetric.labels(result).inc();
  }

  setCheckTokenTransactionsResult(result: 'success' | 'error') {
    StatusMetricsService.checkTokenTransactionsMetric.labels(result).inc();
  }

  setCheckValidatorNodeCountResult(result: 'success' | 'error') {
    StatusMetricsService.checkValidatorNodeCountMetric.labels(result).inc();
  }

  setCheckIdentityNamesResult(result: 'success' | 'error') {
    StatusMetricsService.checkIdentityNamesMetric.labels(result).inc();
  }

  setCheckIdentitiesResult(result: 'success' | 'error') {
    StatusMetricsService.checkIdentitiesMetric.labels(result).inc();
  }
}
