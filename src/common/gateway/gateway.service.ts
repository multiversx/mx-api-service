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
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { ApiService, ApiSettings, BinaryUtils } from "@multiversx/sdk-nestjs";

@Injectable()
export class GatewayService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService
  ) { }

  async getValidatorAuctions(): Promise<Auction[]> {
    const result = await this.get('validator/auction', GatewayComponentRequest.validatorAuction);

    return result.auction;
  }

  async getNetworkStatus(metaChainShardId: number | string): Promise<NetworkStatus> {
    const result = await this.get(`network/status/${metaChainShardId}`, GatewayComponentRequest.networkStatus);
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

    return result;
  }

  async getAddressDetails(address: string): Promise<Account> {
    const result = await this.get(`address/${address}`, GatewayComponentRequest.addressDetails);
    return result;
  }

  async getEsdtSupply(identifier: string): Promise<EsdtSupply> {
    const result = await this.get(`network/esdt/supply/${identifier}`, GatewayComponentRequest.esdtSupply);
    return result;
  }

  async getEsdtFungibleTokens(): Promise<string[]> {
    const result = await this.get('network/esdt/fungible-tokens', GatewayComponentRequest.allFungibleTokens);
    return result.tokens;
  }

  async getAddressEsdtRoles(address: string): Promise<EsdtAddressRoles> {
    const result = await this.get(`address/${address}/esdts/roles`, GatewayComponentRequest.addressEsdtAllRoles);
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

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async get(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const result = await this.getRaw(url, component, errorHandler);
    return result?.data?.data;
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async getRaw(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    return await this.apiService.get(`${this.getUrl(component)}/${url}`, new ApiSettings(), errorHandler);
  }

  private getUrl(component: GatewayComponentRequest): string {
    const lightGatewayComponents = [
      GatewayComponentRequest.addressBalance,
      GatewayComponentRequest.addressDetails,
      GatewayComponentRequest.addressEsdt,
      GatewayComponentRequest.addressNftByNonce,
      GatewayComponentRequest.vmQuery,
    ];

    if (lightGatewayComponents.includes(component)) {
      return this.apiConfigService.getLightGatewayUrl() ?? this.apiConfigService.getGatewayUrl();
    }

    return this.apiConfigService.getGatewayUrl();
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async create(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const result = await this.createRaw(url, component, data, errorHandler);
    return result?.data?.data;
  }

  @LogPerformanceAsync(MetricsEvents.SetGatewayDuration, { argIndex: 1 })
  async createRaw(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    return await this.apiService.post(`${this.getUrl(component)}/${url}`, data, new ApiSettings(), errorHandler);
  }
}
