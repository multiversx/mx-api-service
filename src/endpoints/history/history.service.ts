import { Injectable } from "@nestjs/common";
import { CachingService } from "src/helpers/caching.service";
import { DataService } from "src/helpers/data.service";
import { oneDay } from "src/helpers/helpers";
import { Data } from "./entities/Data";

@Injectable()
export class HistoryService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly dataService: DataService
  ) {}

  async getPrices(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
        'quotesHistorical:price',
        async () => await this.dataService.getQuotesHistorical('price'),
        oneDay()
      );
  }

  async getMarketCap(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
        'quotesHistorical:market_cap',
        async () => await this.dataService.getQuotesHistorical('market_cap'),
        oneDay()
      );
  }

  async getVolume24h(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
        'quotesHistorical:volume_24h',
        async () => await this.dataService.getQuotesHistorical('volume_24h'),
        oneDay()
      );
  }

  async getStakingValue(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
        'stakingHistorical:value',
        async () => await this.dataService.getStakingHistorical('value'),
        oneDay()
      );
  }

  async getStakingUsers(): Promise<number> {
    return await this.cachingService.getOrSetCache(
        'stakingHistorical:users',
        async () => await this.dataService.getStakingUsersHistorical('users'),
        oneDay()
      );
  }

  async getTransactionsCount24h(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
        'transactionsHistorical:count_24h',
        async () => await this.dataService.getTransactionsHistorical('count_24h'),
        oneDay()
      );
  }

  async getAccountsCount(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
        'accountsHistorical:count',
        async () => await this.dataService.getAccountsHistorical('count'),
        oneDay()
      );
  }
}