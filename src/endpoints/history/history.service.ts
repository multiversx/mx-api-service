import { Injectable } from "@nestjs/common";
import { CachingService } from "src/helpers/caching.service";
import { DataApiService } from "src/helpers/data.api.service";
import { oneDay } from "src/helpers/helpers";
import { Data } from "./entities/data";

@Injectable()
export class HistoryService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly dataApiService: DataApiService
  ) {}

  async getPrices(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'quotesHistorical:price',
      async () => await this.dataApiService.getQuotesHistorical('price'),
      oneDay()
    );
  }

  async getMarketCap(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'quotesHistorical:market_cap',
      async () => await this.dataApiService.getQuotesHistorical('market_cap'),
      oneDay()
    );
  }

  async getVolume24h(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'quotesHistorical:volume_24h',
      async () => await this.dataApiService.getQuotesHistorical('volume_24h'),
      oneDay()
    );
  }

  async getStakingValue(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'stakingHistorical:value',
      async () => await this.dataApiService.getStakingHistorical('value'),
      oneDay()
    );
  }

  async getStakingUsers(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      'stakingHistorical:users',
      async () => await this.dataApiService.getStakingUsersHistorical('users'),
      oneDay()
    );
  }

  async getTransactionsCount24h(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'transactionsHistorical:count_24h',
      async () => await this.dataApiService.getTransactionsHistorical('count_24h'),
      oneDay()
    );
  }

  async getAccountsCount(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'accountsHistorical:count',
      async () => await this.dataApiService.getAccountsHistorical('count'),
      oneDay()
    );
  }
}