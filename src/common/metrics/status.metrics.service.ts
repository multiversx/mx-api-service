import { Injectable } from "@nestjs/common";
import { Gauge } from "prom-client";

@Injectable()
export class StatusMetricsService {
  private static checksMetric: Gauge<string>;
  private static totalsMetric: Gauge<string>;

  constructor() {
    if (!StatusMetricsService.totalsMetric) {
      StatusMetricsService.totalsMetric = new Gauge({
        name: 'totals',
        help: 'totals',
        labelNames: ['name'],
      });
    }

    if (!StatusMetricsService.checksMetric) {
      StatusMetricsService.checksMetric = new Gauge({
        name: 'checks',
        help: 'checks',
        labelNames: ['name', 'result'],
      });
    }
  }

  setTotalAccounts(total: number) {
    StatusMetricsService.totalsMetric.labels('total_accounts').set(total);
  }

  setTotalBlocks(total: number) {
    StatusMetricsService.totalsMetric.labels('total_blocks').set(total);
  }

  setTotalCollections(total: number) {
    StatusMetricsService.totalsMetric.labels('total_collections').set(total);
  }

  setTotalNfts(total: number) {
    StatusMetricsService.totalsMetric.labels('total_nfts').set(total);
  }

  setTotalTags(total: number) {
    StatusMetricsService.totalsMetric.labels('total_tags').set(total);
  }

  setTotalRounds(total: number) {
    StatusMetricsService.totalsMetric.labels('total_rounds').set(total);
  }

  setTotalResults(total: number) {
    StatusMetricsService.totalsMetric.labels('total_results').set(total);
  }

  setTotalTokens(total: number) {
    StatusMetricsService.totalsMetric.labels('total_tokens').set(total);
  }

  setTotalTransactions(total: number) {
    StatusMetricsService.totalsMetric.labels('total_transactions').set(total);
  }

  setTotalTransfers(total: number) {
    StatusMetricsService.totalsMetric.labels('total_transfers').set(total);
  }

  setTotalShardRounds(shard: number, round: number) {
    StatusMetricsService.totalsMetric.labels(`total_shard_rounds_${shard}`).set(round);
  }

  setTotalShardNonces(shard: number, nonce: number) {
    StatusMetricsService.totalsMetric.labels(`total_shard_nonces_${shard}`).set(nonce);
  }

  setTotalIdentities(total: number) {
    StatusMetricsService.totalsMetric.labels('total_identities').set(total);
  }

  setTotalNodes(total: number) {
    StatusMetricsService.totalsMetric.labels('total_nodes').set(total);
  }

  setTotalProviders(total: number) {
    StatusMetricsService.totalsMetric.labels('total_providers').set(total);
  }

  setTotalShards(total: number) {
    StatusMetricsService.totalsMetric.labels('total_shards').set(total);
  }

  setTotalMexPairs(total: number) {
    StatusMetricsService.totalsMetric.labels('total_mex_pairs').set(total);
  }

  setTotalMexFarms(total: number) {
    StatusMetricsService.totalsMetric.labels('total_mex_farms').set(total);
  }

  setTotalMexTokens(total: number) {
    StatusMetricsService.totalsMetric.labels('total_mex_tokens').set(total);
  }

  setMexEconomicsValue(name: string, value: number) {
    StatusMetricsService.totalsMetric.labels(`mex_economics_${name}`).set(value);
  }

  setEconomicsValue(name: string, value: number) {
    StatusMetricsService.totalsMetric.labels(`economics_${name}`).set(value);
  }

  setCheckTokenCountResult(result: 'success' | 'error') {
    StatusMetricsService.checksMetric.labels('check_token_count', result).inc();
  }

  setCheckNodeCountResult(result: 'success' | 'error') {
    StatusMetricsService.checksMetric.labels('check_node_count', result).inc();
  }

  setCheckProviderCountResult(result: 'success' | 'error') {
    StatusMetricsService.checksMetric.labels('check_provider_count', result).inc();
  }

  setCheckTokenSupplyResult(result: 'success' | 'error') {
    StatusMetricsService.checksMetric.labels('check_token_supply', result).inc();
  }

  setCheckTokenAssetsResult(result: 'success' | 'error') {
    StatusMetricsService.checksMetric.labels('check_token_assets', result).inc();
  }

  setCheckTokenAccountsResult(result: 'success' | 'error') {
    StatusMetricsService.checksMetric.labels('check_token_accounts', result).inc();
  }

  setCheckTokenTransactionsResult(result: 'success' | 'error') {
    StatusMetricsService.checksMetric.labels('check_token_transactions', result).inc();
  }

  setCheckValidatorNodeCountResult(result: 'success' | 'error') {
    StatusMetricsService.checksMetric.labels('check_validator_node_count', result).inc();
  }

  setCheckIdentityNamesResult(result: 'success' | 'error') {
    StatusMetricsService.checksMetric.labels('check_identity_names', result).inc();
  }

  setCheckIdentitiesResult(result: 'success' | 'error') {
    StatusMetricsService.checksMetric.labels('check_identities', result).inc();
  }
}
