import { ApiService, ApiSettings, PerformanceProfiler } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { ApiMetricsService } from "../metrics/api.metrics.service";
import { Account } from "./entities/account";
import { Auction } from "./entities/auction";
import { EsdtAddressRoles } from "./entities/esdt.roles";
import { EsdtSupply } from "./entities/esdt.supply";
import { GatewayComponentRequest } from "./entities/gateway.component.request";
import { HeartBeatsStatus } from "./entities/heartbeats.status";
import { NetworkConfig } from "./entities/network.config";
import { NetworkEconomics } from "./entities/network.economics";
import { NetworkStatus } from "./entities/network.status";
import { TokenData } from "./entities/token.data";
import { Transaction } from "./entities/transaction";

@Injectable()
export class GatewayService {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => ApiMetricsService))
    private readonly metricsService: ApiMetricsService,
  ) { }

  async getAuctions(): Promise<Auction[]> {
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

  async getHeartbeatsStatus(): Promise<HeartBeatsStatus[]> {
    const result = await this.get('node/heartbeatstatus', GatewayComponentRequest.nodeHeartbeat);
    return result.heartbeats;
  }

  async getAccountAddress(address: string): Promise<Account> {
    const result = await this.get(`address/${address}`, GatewayComponentRequest.addressDetails);
    return result;
  }

  async getEsdtSupply(identifier: string): Promise<EsdtSupply> {
    const result = await this.get(`network/esdt/supply/${identifier}`, GatewayComponentRequest.esdtSupply);
    return result;
  }

  async getFungibleEsdtTokens(): Promise<string[]> {
    const result = await this.get('network/esdt/fungible-tokens', GatewayComponentRequest.allFungibleTokens);
    return result.tokens;
  }

  async getAddressEsdtRoles(address: string): Promise<EsdtAddressRoles> {
    const result = await this.get(`address/${address}/esdts/roles`, GatewayComponentRequest.addressEsdtAllRoles);
    return result;
  }

  async getTokenAddress(address: string, identifier: string): Promise<TokenData> {
    // eslint-disable-next-line require-await
    const result = await this.get(`address/${address}/esdt/${identifier}`, GatewayComponentRequest.addressEsdtBalance, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return true;
      }

      return false;
    });
    return result.tokenData;
  }

  async getGatewayTransaction(txHash: string): Promise<Transaction> {
    // eslint-disable-next-line require-await
    const result = await this.get(`transaction/${txHash}?withResults=true`, GatewayComponentRequest.transactionDetails, async (error) => {
      if (error.response.data.error === 'transaction not found') {
        return true;
      }

      return false;
    });

    return result.transaction;
  }

  async get(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      const result = await this.getRaw(url, component, errorHandler);
      return result?.data?.data;
    } finally {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }

  async getRaw(url: string, component: GatewayComponentRequest, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      return await this.apiService.get(`${this.getUrl(component)}/${url}`, new ApiSettings(), errorHandler);
    } finally {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }

  private getUrl(component: GatewayComponentRequest): string {
    const lightGatewayComponents = [
      GatewayComponentRequest.addressBalance,
      GatewayComponentRequest.addressDetails,
      GatewayComponentRequest.addressEsdt,
      GatewayComponentRequest.vmQuery,
    ];

    if (lightGatewayComponents.includes(component)) {
      return this.apiConfigService.getLightGatewayUrl() ?? this.apiConfigService.getGatewayUrl();
    }

    return this.apiConfigService.getGatewayUrl();
  }

  async create(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      const result = await this.createRaw(url, component, data, errorHandler);
      return result?.data?.data;

    } finally {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }

  async createRaw(url: string, component: GatewayComponentRequest, data: any, errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();

    try {
      return await this.apiService.post(`${this.apiConfigService.getGatewayUrl()}/${url}`, data, new ApiSettings(), errorHandler);
    } finally {
      profiler.stop();

      this.metricsService.setGatewayDuration(component, profiler.duration);
    }
  }
}
