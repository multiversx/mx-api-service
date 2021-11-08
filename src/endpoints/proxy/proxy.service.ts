import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { ApiService } from 'src/common/network/api.service';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { AddressUtils } from 'src/utils/address.utils';
import { CircularQueueProvider } from 'src/utils/circular-queue-provider';
import { Account } from './entities/account';
import { ProxyResponse } from './entities/proxy.response';
import { Observer } from './entities/observer';

@Injectable()
export class ProxyService {
  private readonly logger: Logger;
  private readonly circularQueueProvider: CircularQueueProvider;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
  ) {
    this.logger = new Logger(ProxyService.name);
    this.circularQueueProvider = new CircularQueueProvider(
      this.apiConfigService.getObservers(),
    );
  }

  async getAccount(address: string): Promise<{ account: Account }> {
    const { data } = await this.getAccountRaw(address);
    return data;
  }

  async getAccountRaw(address: string): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(`address/${address}`);
      return data;
    }

    const observers = this.getObserversForAddress(address);
    const { data } = await this.getRaw(`/address/${address}`, observers);
    return ProxyResponse.withSuccess({
      account: new Account(data?.account),
    });
  }

  async getBalanceRaw(address: string): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `address/${address}/balance`,
      );
      return data;
    }

    const { account } = await this.getAccount(address);
    return ProxyResponse.withSuccess({
      balance: account?.balance,
    });
  }

  async getNonceRaw(address: string): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `address/${address}/balance`,
      );
      return data;
    }

    const { account } = await this.getAccount(address);
    return ProxyResponse.withSuccess({
      nonce: account?.nonce,
    });
  }

  async getStorageValueRaw(
    address: string,
    key: string,
  ): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `address/${address}/key/${key}`,
      );
      return data;
    }

    const observers = this.getObserversForAddress(address);
    const { data } = await this.getRaw(
      `/address/${address}/key/${key}`,
      observers,
    );
    return ProxyResponse.withSuccess({
      value: data?.value,
    });
  }

  async getShardRaw(address: string): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `address/${address}/shard`,
      );
      return data;
    }

    try {
      const shardId = AddressUtils.computeShard(
        AddressUtils.bech32Decode(address),
      );
      return ProxyResponse.withSuccess({
        shardID: shardId,
      });
    } catch {
      throw new InternalServerErrorException({
        data: ProxyResponse.withError(
          'compute shard ID for address error',
          'internal_issue',
        ),
      });
    }
  }

  async getEsdtTokens(address: string): Promise<{ esdts: any }> {
    const { data } = await this.getEsdtTokensRaw(address);
    return data;
  }

  async getEsdtTokensRaw(address: string): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `address/${address}/esdt`,
      );
      return data;
    }

    const observers = this.getObserversForAddress(address);
    const { data } = await this.getRaw(`/address/${address}/esdt`, observers);
    return ProxyResponse.withSuccess({
      esdts: data?.esdts,
    });
  }

  async getEsdtTokenRaw(
    address: string,
    tokenIdentifier: string,
  ): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `address/${address}/esdt/${tokenIdentifier}`,
      );
      return data;
    }

    const observers = this.getObserversForAddress(address);
    const { data } = await this.getRaw(
      `/address/${address}/esdt/${tokenIdentifier}`,
      observers,
    );
    return ProxyResponse.withSuccess({
      tokenData: data?.tokenData,
    });
  }

  async getEsdtsRoles(address: string): Promise<{ roles: any }> {
    const { data } = await this.getEsdtsRolesRaw(address);
    return data;
  }

  async getEsdtsRolesRaw(address: string): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `address/${address}/esdts/roles`,
      );
      return data;
    }

    const observers = this.circularQueueProvider.getNodesByShardId(
      this.apiConfigService.getMetaChainShardId(),
    );
    const { data } = await this.getRaw(
      `/address/${address}/esdts/roles`,
      observers,
    );
    return ProxyResponse.withSuccess({
      roles: data?.roles,
    });
  }

  async getEsdtNftTokenRaw(
    address: string,
    tokenIdentifier: string,
    nonce: number,
  ): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `address/${address}/nft/${tokenIdentifier}/nonce/${nonce}`,
      );
      return data;
    }

    const observers = this.getObserversForAddress(address);
    const { data } = await this.getRaw(
      `/address/${address}/nft/${tokenIdentifier}/nonce/${nonce}`,
      observers,
    );
    return ProxyResponse.withSuccess({
      tokenData: data?.tokenData,
    });
  }

  async getRegisteredNfts(address: string): Promise<{ tokens: any[] }> {
    const { data } = await this.getRegisteredNftsRaw(address);
    return data;
  }

  async getRegisteredNftsRaw(address: string): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `address/${address}/registered-nfts`,
      );
      return data;
    }

    const observers = this.circularQueueProvider.getNodesByShardId(
      this.apiConfigService.getMetaChainShardId(),
    );
    const { data } = await this.getRaw(
      `/address/${address}/registered-nfts`,
      observers,
    );
    return ProxyResponse.withSuccess({
      tokens: data?.tokens,
    });
  }

  async getEsdtsWithRole(
    address: string,
    role: string,
  ): Promise<{ tokens: any[] }> {
    const { data } = await this.getEsdtsWithRoleRaw(address, role);
    return data;
  }

  async getEsdtsWithRoleRaw(
    address: string,
    role: string,
  ): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `address/${address}/esdts-with-role/${role}`,
      );
      return data;
    }

    const observers = this.circularQueueProvider.getNodesByShardId(
      this.apiConfigService.getMetaChainShardId(),
    );
    const { data } = await this.getRaw(
      `/address/${address}/esdts-with-role/${role}`,
      observers,
    );
    return ProxyResponse.withSuccess({
      tokens: data?.tokens,
    });
  }

  async getNetworkConfig(): Promise<{ config: any }> {
    const { data } = await this.getNetworkConfigRaw();
    return data;
  }

  async getNetworkConfigRaw(): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw('network/config');
      return data;
    }

    const observers = this.circularQueueProvider.getAllNodes();
    const { data } = await this.getRaw('/network/config', observers);
    return ProxyResponse.withSuccess({
      config: data?.config,
    });
  }

  async getNetworkStatus(shardId: number): Promise<{ status: any }> {
    const { data } = await this.getNetworkStatusRaw(shardId);
    return data;
  }

  async getNetworkStatusRaw(shardId: number): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        `network/status/${shardId}`,
      );
      return data;
    }

    const observers = this.circularQueueProvider.getNodesByShardId(shardId);
    const { data } = await this.getRaw('/network/status', observers);
    return ProxyResponse.withSuccess({
      status: data?.status,
    });
  }

  async getEconomics(): Promise<{ metrics: any }> {
    const { data } = await this.getEconomicsRaw();
    return data;
  }

  async getEconomicsRaw(): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw('network/economics');
      return data;
    }

    const observers = this.circularQueueProvider.getNodesByShardId(
      this.apiConfigService.getMetaChainShardId(),
    );
    const { data } = await this.getRaw('/network/economics', observers);
    return ProxyResponse.withSuccess({
      metrics: data?.metrics,
    });
  }

  async getFungibleTokens(): Promise<{ tokens: string[] }> {
    const { data } = await this.getFungibleTokensRaw();
    return data;
  }

  async getFungibleTokensRaw(): Promise<ProxyResponse> {
    if (this.apiConfigService.getUseProxyFlag()) {
      const { data } = await this.gatewayService.getRaw(
        'network/esdt/fungible-tokens',
      );
      return data;
    }

    const observers = this.circularQueueProvider.getNodesByShardId(
      this.apiConfigService.getMetaChainShardId(),
    );
    const { data } = await this.getRaw(
      '/network/esdt/fungible-tokens',
      observers,
    );
    return ProxyResponse.withSuccess({
      tokens: data?.tokens,
    });
  }

  private async getRaw(path: string, observers: Observer[]): Promise<any> {
    let lastError: any = new InternalServerErrorException({
      data: ProxyResponse.withError('sending request error', 'internal_issue'),
    });
    for (const observer of observers) {
      try {
        const { data } = await this.apiService.get(
          `http://${observer.address}${path}`,
        );
        return data;
      } catch (error: any) {
        this.logger.error('Error: ', error);
        lastError = error;
        if (
          error?.response?.status === HttpStatus.BAD_REQUEST ||
          error?.response?.status === HttpStatus.INTERNAL_SERVER_ERROR
        ) {
          break;
        }
      }
    }
    throw lastError;
  }

  private getObserversForAddress(address: string) {
    try {
      const shardId = AddressUtils.computeShard(
        AddressUtils.bech32Decode(address),
      );
      const observers = this.circularQueueProvider.getNodesByShardId(shardId);
      return observers;
    } catch {
      return [];
    }
  }
}
