import { Injectable } from "@nestjs/common";
import { CachingService } from "src/helpers/caching.service";
import { DataApiService } from "src/helpers/data.api.service";
import { oneDay, oneMinute } from "src/helpers/helpers";
import { Data } from "./entities/data";

@Injectable()
export class HistoryService {
  constructor(
    private readonly cachingService: CachingService,
    private readonly dataApiService: DataApiService
  ) {}

  private async tryInvalidateHistory(key: string): Promise<string | undefined>{
    const date = new Date();
    const hour = date.getHours();
    const minute = date.getMinutes();

    // Save in cache at first 3 minutes of day
    if (hour === 0 && minute > 0  && minute < 3) {
      await this.cachingService.deleteInCache(key);
    }

    return key;
  }


  async getPrices(): Promise<Data[]> {
    await this.tryInvalidateHistory('quotesHistorical:price');

    return await this.cachingService.getOrSetCache(
      'quotesHistorical:price',
      async () => await this.dataApiService.getQuotesHistorical('price'),
      oneDay()
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
    await this.tryInvalidateHistory('quotesHistorical:market_cap');

    return await this.cachingService.getOrSetCache(
      'quotesHistorical:market_cap',
      async () => await this.dataApiService.getQuotesHistorical('market_cap'),
      oneDay()
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
    await this.tryInvalidateHistory('quotesHistorical:volume_24h');

    return await this.cachingService.getOrSetCache(
      'quotesHistorical:volume_24h',
      async () => await this.dataApiService.getQuotesHistorical('volume_24h'),
      oneDay()
    );
  }

  async getStakingValue(): Promise<Data[]> {
    await this.tryInvalidateHistory('stakingHistorical:value');

    return await this.cachingService.getOrSetCache(
      'stakingHistorical:value',
      async () => await this.dataApiService.getStakingHistorical('value'),
      oneDay()
    );
  }

  async getStakingUsers(): Promise<number> {
    await this.tryInvalidateHistory('stakingHistorical:users');

    return await this.cachingService.getOrSetCache(
      'stakingHistorical:users',
      async () => await this.dataApiService.getStakingUsersHistorical('users'),
      oneDay()
    );
  }

  async getTransactionsCount24h(): Promise<Data[]> {
    await this.tryInvalidateHistory('transactionsHistorical:count_24h');

    return await this.cachingService.getOrSetCache(
      'transactionsHistorical:count_24h',
      async () => await this.dataApiService.getTransactionsHistorical('count_24h'),
      oneDay()
    );
  }

  async getAccountsCount(): Promise<Data[]> {
    await this.tryInvalidateHistory('accountsHistorical:count');

    return await this.cachingService.getOrSetCache(
      'accountsHistorical:count',
      async () => await this.dataApiService.getAccountsHistorical('count'),
      oneDay()
    );
  }
}