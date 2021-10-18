import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ApiConfigService } from 'src/common/api.config.service';
import { ApiService } from 'src/common/api.service';
import { AddressUtils } from 'src/utils/address.utils';
import {
  CircularQueueProvider,
  Observer,
} from 'src/utils/circular-queue-provider';

@Injectable()
export class ProxyService {
  private readonly logger: Logger;
  private readonly circularQueueProvider: CircularQueueProvider;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
  ) {
    this.logger = new Logger(ProxyService.name);
    this.circularQueueProvider = new CircularQueueProvider(
      this.apiConfigService.getObservers(),
    );
  }

  async getAccount(address: string): Promise<any> {
    const observers = this.getObserversForAddress(address);
    const data = await this.getRaw(`/address/${address}`, observers);
    return data;
  }

  async getAllEsdts(address: string): Promise<any> {
    const observers = this.getObserversForAddress(address);
    const { data } = await this.getRaw(`/address/${address}/esdt`, observers);
    return data;
  }

  async getEsdtsRoles(address: string): Promise<any> {
    const observers = this.circularQueueProvider.getNodesByShardId(
      this.apiConfigService.getMetaChainShardId(),
    );
    const { data } = await this.getRaw(`/address/${address}/esdts/roles`, observers);
    return data;
  }

  async getRegisteredNfts(address: string): Promise<any> {
    const observers = this.circularQueueProvider.getNodesByShardId(
      this.apiConfigService.getMetaChainShardId(),
    );
    const { data } = await this.getRaw(`/address/${address}/registered-nfts`, observers);
    return data;
  }

  async getEsdtsWithRole(address: string, role: string): Promise<any> {
    const observers = this.circularQueueProvider.getNodesByShardId(
      this.apiConfigService.getMetaChainShardId(),
    );
    const { data } = await this.getRaw(`/address/${address}/esdts-with-role/${role}`, observers);
    return data;
  }

  async getNetworkConfig(): Promise<any> {
    const observers = this.circularQueueProvider.getAllNodes();
    const data = await this.getRaw('/network/config', observers);
    return data;
  }

  async getNetworkStatus(shardId: number): Promise<any> {
    const observers = this.circularQueueProvider.getNodesByShardId(shardId);
    const data = await this.getRaw('/network/status', observers);
    return data;
  }

  async getEconomics(): Promise<any> {
    const observers = this.circularQueueProvider.getNodesByShardId(
      this.apiConfigService.getMetaChainShardId(),
    );
    const data = await this.getRaw('/network/economics', observers);
    return data;
  }

  async getFungibleTokens(): Promise<any> {
    const observers = this.circularQueueProvider.getNodesByShardId(
      this.apiConfigService.getMetaChainShardId(),
    );
    const data = await this.getRaw('/network/esdt/fungible-tokens', observers);
    return data;
  }

  private async getRaw(path: string, observers: Observer[]): Promise<any> {
    for (const observer of observers) {
      try {
        const { data } = await this.apiService.get(
          `http://${observer.address}${path}`,
        );
        return data;
      } catch (error) {
        this.logger.error('Error: ', error);
      }
    }
    throw Error('Sending request error');
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
