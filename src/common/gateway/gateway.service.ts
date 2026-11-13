import { Account } from "./entities/account";
import { Auction } from "./entities/auction";
import { EsdtAddressRoles } from "./entities/esdt.roles";
import { EsdtSupply } from "./entities/esdt.supply";
import { GatewayComponentRequest } from "./entities/gateway.component.request";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { LogPerformanceAsync } from "src/utils/log.performance.decorator";
import { HeartbeatStatus } from "./entities/heartbeat.status";
import { TrieStatistics } from "./entities/trie.statistics";
import { NetworkConfig } from "./entities/network.config";
import { NetworkEconomics } from "./entities/network.economics";
import { NetworkStatus } from "./entities/network.status";
import { NftData } from "./entities/nft.data";
import { TokenData } from "./entities/token.data";
import { Transaction } from "./entities/transaction";
import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { BinaryUtils, ContextTracker } from "@multiversx/sdk-nestjs-common";
import { ApiService, ApiSettings } from "@multiversx/sdk-nestjs-http";
import { GuardianResult } from "./entities/guardian.result";
import { TransactionProcessStatus } from "./entities/transaction.process.status";
import { TxPoolGatewayResponse } from "./entities/tx.pool.gateway.response";

@Injectable()
export class GatewayService {
  private readonly snapshotlessRequestsSet: Set<String> = new Set([
    GatewayComponentRequest.addressBalance,
    GatewayComponentRequest.addressDetails,
    GatewayComponentRequest.addressEsdt,
    GatewayComponentRequest.addressNftByNonce,
    GatewayComponentRequest.vmQuery,
    GatewayComponentRequest.transactionPool,
    GatewayComponentRequest.guardianData,
    GatewayComponentRequest.validatorAuction,
  ]);

  private readonly deepHistoryRequestsSet: Set<String> = new Set([
    GatewayComponentRequest.addressDetails,
    GatewayComponentRequest.addressEsdt,
    GatewayComponentRequest.addressEsdtBalance,
    GatewayComponentRequest.addressNftByNonce,
    GatewayComponentRequest.vmQuery,
  ]);

  private readonly maxTriePages = 1000;
  private readonly maxTrieWalkRestarts = 1;
  private readonly maxTrieBusyRetries = 5;
  private readonly trieBusyRetryDelayMs = 200;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService
  ) { }

  async getVersion(): Promise<string | undefined> {
    const result = await this.get('about', GatewayComponentRequest.about);

    if (result && result.appVersion && result.appVersion !== "undefined") {
      return result.appVersion;
    }

    return undefined;
  }

  async getValidatorAuctions(): Promise<Auction[]> {
    const result = await this.get('validator/auction', GatewayComponentRequest.validatorAuction);
    return result.auctionList;
  }

  async getNetworkStatus(shardId: number | string): Promise<NetworkStatus> {
    const result = await this.get(`network/status/${shardId}`, GatewayComponentRequest.networkStatus);
    return result.status;
  }

  async getNetworkConfig(): Promise<NetworkConfig> {
    const result = await this.get('network/config', GatewayComponentRequest.networkConfig);
    return result.config;
  }

  async getNetworkEconomics(): Promise<NetworkEconomics> {
    const result = await this.get('network/economics', GatewayComponentRequest.networkEconomics);
    return result.metrics;
  }

  async getNodeHeartbeatStatus(): Promise<HeartbeatStatus[]> {
    const result = await this.get('node/heartbeatstatus', GatewayComponentRequest.nodeHeartbeat);
    return result.heartbeats;
  }

  async getTrieStatistics(shardId: number): Promise<TrieStatistics> {
    const result = await this.get(`network/trie-statistics/${shardId}`, GatewayComponentRequest.trieStatistics);

    return new TrieStatistics({
      accounts_snapshot_num_nodes: result['accounts-snapshot-num-nodes'],
    });
  }

  async getNetworkEnableEpochs(): Promise<Record<string, number>> {
    const result = await this.get(`network/enable-epochs`, GatewayComponentRequest.networkEnableEpochs);
    return result.enableEpochs;
  }

  async getNetworkEnableEpochsV2(): Promise<Record<string, number>> {
    const result = await this.get(`network/enable-epochs-v2`, GatewayComponentRequest.networkEnableEpochsV2);
    return result.enableEpochs;
  }

  async getAddressDetails(address: string): Promise<Account> {
    const result = await this.get(`address/${address}`, GatewayComponentRequest.addressDetails);
    return result;
  }

  async getAccountsBulk(addresses: string[]): Promise<Account[]> {
    const result = await this.create('address/bulk', GatewayComponentRequest.addressesBulk, addresses);
    return result.accounts;
  }

  async getEsdtSupply(identifier: string): Promise<EsdtSupply> {
    const result = await this.get(`network/esdt/supply/${identifier}`, GatewayComponentRequest.esdtSupply);
    return result;
  }

  async getEsdtFungibleTokens(): Promise<string[]> {
    const result = await this.getPaged('network/esdt/fungible-tokens', GatewayComponentRequest.allFungibleTokens, 'tokens');
    return result.tokens;
  }

  async getAddressEsdtRoles(address: string): Promise<EsdtAddressRoles> {
    const result = await this.getPaged(`address/${address}/esdts/roles`, GatewayComponentRequest.addressEsdtAllRoles, 'roles');
    return result;
  }

  async getGuardianData(address: string): Promise<GuardianResult> {
    const result = await this.get(`address/${address}/guardian-data`, GatewayComponentRequest.guardianData);
    return result;
  }

  async getNodeWaitingEpochsLeft(bls: string): Promise<number> {
    const result = await this.get(`node/waiting-epochs-left/${bls}`, GatewayComponentRequest.getNodeWaitingEpochsLeft);
    return result.epochsLeft;
  }

  async getTransactionProcessStatus(txHash: string): Promise<TransactionProcessStatus> {
    // eslint-disable-next-line require-await
    const result = await this.get(`transaction/${txHash}/process-status`, GatewayComponentRequest.transactionProcessStatus, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('transaction not found')) {
        return true;
      }

      return false;
    });

    return result;
  }

  async getAddressEsdt(address: string, identifier: string): Promise<TokenData> {
    // eslint-disable-next-line require-await
    const result = await this.get(`address/${address}/esdt/${identifier}`, GatewayComponentRequest.addressEsdtBalance, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return true;
      }

      return false;
    });

    return new TokenData(result.tokenData);
  }

  async getAddressNft(address: string, identifier: string): Promise<NftData> {
    const esdtIdentifier = identifier.split('-').slice(0, 2).join('-');
    const nonceHex = identifier.split('-').last();
    const nonceNumeric = BinaryUtils.hexToNumber(nonceHex);

    // eslint-disable-next-line require-await
    const result = await this.get(`address/${address}/nft/${esdtIdentifier}/nonce/${nonceNumeric}`, GatewayComponentRequest.addressNftByNonce, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return true;
      }

      return false;
    });

    return new NftData(result.tokenData);
  }

  async getTransactionPool(): Promise<TxPoolGatewayResponse | null> {
    try {
      return await this.get(`transaction/pool?fields=*`, GatewayComponentRequest.transactionPool);
    } catch (error: any) {
      if (error?.message?.startsWith('maxContentLength size of')) {
        return null;
      }

      throw error;
    }
  }

  async getTransactionPoolCount(): Promise<number> {
    const result = await this.get('transaction/pool/count', GatewayComponentRequest.transactionPool);

    return Object.values<number>(result.txPoolCounts).reduce((total, count) => total + count, 0);
  }

  async getTransaction(txHash: string): Promise<Transaction | undefined> {
    // eslint-disable-next-line require-await
    const result = await this.get(`transaction/${txHash}?withResults=true`, GatewayComponentRequest.transactionDetails, async (error) => {
      if (error.response.data.error === 'transaction not found') {
        return true;
      }

      return false;
    });

    return result?.transaction;
  }

  async getBlockByShardAndNonce(shard: number, nonce: number, withTxs?: boolean): Promise<any> {
    const result = await this.get(`block/${shard}/by-nonce/${nonce}?withTxs=${withTxs ?? false}`, GatewayComponentRequest.blockByNonce);

    return result.block;
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async get(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const result = await this.getRaw(url, component, errorHandler);

    this.applyDeepHistoryBlockInfoIfRequired(component, result);

    return result?.data?.data;
  }

  async getPaged(url: string, component: GatewayComponentRequest, itemsField: string, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    for (let restart = 0; ; restart++) {
      try {
        return await this.getAllPages(url, component, itemsField, errorHandler);
      } catch (error: any) {
        const isIteratorNodeUnavailable = error?.response?.error?.includes('iterator node unavailable');
        if (!isIteratorNodeUnavailable || restart >= this.maxTrieWalkRestarts) {
          throw error;
        }
      }
    }
  }

  private async getAllPages(url: string, component: GatewayComponentRequest, itemsField: string, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    let result: any = undefined;
    let pageUrl = url;

    for (let page = 0; page < this.maxTriePages; page++) {
      const data = await this.getTriePage(pageUrl, component, errorHandler);
      if (!data) {
        return result;
      }

      const { iteratorState, ...pageData } = data;
      if (result === undefined) {
        result = pageData;
      } else if (Array.isArray(result[itemsField])) {
        result[itemsField] = result[itemsField].concat(pageData[itemsField] ?? []);
      } else {
        result[itemsField] = { ...result[itemsField], ...pageData[itemsField] };
      }

      if (!iteratorState) {
        return result;
      }

      const encodedIteratorState = Buffer.from(JSON.stringify(iteratorState)).toString('base64url');
      pageUrl = `${url}${url.includes('?') ? '&' : '?'}iteratorState=${encodedIteratorState}`;
    }

    throw new Error(`Trie walk for '${url}' exceeded ${this.maxTriePages} pages`);
  }

  private async getTriePage(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    for (let retry = 0; ; retry++) {
      try {
        return await this.get(url, component, errorHandler);
      } catch (error: any) {
        if (error?.status !== HttpStatus.TOO_MANY_REQUESTS || retry >= this.maxTrieBusyRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, this.trieBusyRetryDelayMs * (retry + 1)));
      }
    }
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async getRaw(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const fullUrl = this.getFullUrl(component, url);
    const settings = component === GatewayComponentRequest.transactionPool ?
      { maxContentLength: 2 * 1024 * 1024 } : // 2 MB
      new ApiSettings();

    return await this.apiService.get(fullUrl, settings, errorHandler);
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async create(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const result = await this.createRaw(url, component, data, errorHandler);

    this.applyDeepHistoryBlockInfoIfRequired(component, result);

    return result?.data?.data;
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async createRaw(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const fullUrl = this.getFullUrl(component, url);

    return await this.apiService.post(fullUrl, data, new ApiSettings(), errorHandler);
  }

  private getFullUrl(component: GatewayComponentRequest, suffix: string) {
    const url = new URL(`${this.getGatewayUrl(component)}/${suffix}`);

    const context = ContextTracker.get();
    if (context && context.deepHistoryBlockNonce && this.deepHistoryRequestsSet.has(component)) {
      url.searchParams.set('blockNonce', context.deepHistoryBlockNonce);
    }

    return url.href;
  }

  private getGatewayUrl(component: GatewayComponentRequest): string {
    const context = ContextTracker.get();
    if (context && context.deepHistoryBlockNonce && this.deepHistoryRequestsSet.has(component)) {
      return this.apiConfigService.getDeepHistoryGatewayUrl();
    }

    if (this.snapshotlessRequestsSet.has(component)) {
      return this.apiConfigService.getSnapshotlessGatewayUrl() ?? this.apiConfigService.getGatewayUrl();
    }

    return this.apiConfigService.getGatewayUrl();
  }

  private applyDeepHistoryBlockInfoIfRequired(component: GatewayComponentRequest, result: any) {
    const context = ContextTracker.get();
    if (context && context.deepHistoryBlockNonce && this.deepHistoryRequestsSet.has(component)) {
      const blockInfo = result?.data?.data?.blockInfo;
      if (blockInfo) {
        ContextTracker.assign({
          deepHistoryBlockInfo: blockInfo,
        });
      }
    }
  }
}
