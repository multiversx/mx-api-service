import { Injectable } from "@nestjs/common";
import { CachingService } from "src/helpers/caching.service";
import { DataApiService } from "src/helpers/data.api.service";
import { oneMinute } from "src/helpers/helpers";
import { Data } from "./entities/data";

@Injectable()
export class HistoryService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly dataApiService: DataApiService
  ) {}

  private getTtlUntilEndOfDay(): number {
    let currentTimestamp = new Date().getTime();
    let endOfDay = new Date();
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setUTCHours(0, 10, 0);

    let endOfDayTimestamp = endOfDay.getTime();

    return endOfDayTimestamp - currentTimestamp;
  }

  async getPrices(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'quotesHistorical:price',
      async () => await this.dataApiService.getQuotesHistorical('price'),
      this.getTtlUntilEndOfDay()
    );
  }

  async getLatestPrice(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      'quotesHistorical:price:latest',
      async () => await this.dataApiService.getQuotesHistoricalLatest('price'),
      oneMinute()
    );
  }

  async getMarketCap(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'quotesHistorical:market_cap',
      async () => await this.dataApiService.getQuotesHistorical('market_cap'),
      this.getTtlUntilEndOfDay()
    );
  }

  async getLatestMarketCap(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      'quotesHistorical:market_cap:latest',
      async () => await this.dataApiService.getQuotesHistoricalLatest('market_cap'),
      oneMinute()
    );
  }

  async getVolume24h(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'quotesHistorical:volume_24h',
      async () => await this.dataApiService.getQuotesHistorical('volume_24h'),
      this.getTtlUntilEndOfDay()
    );
  }

  async getStakingValue(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'stakingHistorical:value',
      async () => await this.dataApiService.getStakingHistorical('value'),
      this.getTtlUntilEndOfDay()
    );
  }

  async getStakingUsers(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      'stakingHistorical:users',
      async () => await this.dataApiService.getStakingUsersHistorical('users'),
      this.getTtlUntilEndOfDay()
    );
  }

  async getTransactionsCount24h(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'transactionsHistorical:count_24h',
      async () => await this.dataApiService.getTransactionsHistorical('count_24h'),
      this.getTtlUntilEndOfDay()
    );
  }

  async getAccountsCount(): Promise<Data[]> {
    return await this.cachingService.getOrSetCache(
      'accountsHistorical:count',
      async () => await this.dataApiService.getAccountsHistorical('count'),
      this.getTtlUntilEndOfDay()
    );
  }
}