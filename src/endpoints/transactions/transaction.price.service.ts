import { Constants } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Injectable } from "@nestjs/common";
import { CacheInfo } from "src/utils/cache.info";
import { TransactionDetailed } from "./entities/transaction.detailed";
import { DataApiService } from "src/common/data-api/data-api.service";

@Injectable()
export class TransactionPriceService {

  constructor(
    private readonly cachingService: CacheService,
    private readonly dataApiService: DataApiService,
  ) { }

  async getTransactionPrice(transaction: TransactionDetailed): Promise<number | undefined> {
    const transactionDate = transaction.getDate();
    if (!transactionDate) {
      return undefined;
    }

    let price = await this.getTransactionPriceForDate(transactionDate);
    if (price) {
      price = Number(price).toRounded(2);
    }

    return price;
  }

  private async getTransactionPriceForDate(date: Date): Promise<number | undefined> {
    if (date.isToday()) {
      return await this.getTransactionPriceToday();
    }

    return await this.getTransactionPriceHistorical(date);
  }

  private async getTransactionPriceToday(): Promise<number | undefined> {
    const cachedPrice = await this.cachingService.get<number | undefined>(CacheInfo.CurrentPrice.key);
    if (cachedPrice) {
      return cachedPrice;
    }

    const price = await this.dataApiService.getEgldPrice();
    if (price) {
      await this.cachingService.set(CacheInfo.CurrentPrice.key, price, CacheInfo.CurrentPrice.ttl);
    }

    return price;
  }

  private async getTransactionPriceHistorical(date: Date): Promise<number | undefined> {
    const cacheKey = `price:${date.toISODateString()}`;

    const cachedPrice = await this.cachingService.get<number | undefined>(cacheKey);
    if (cachedPrice) {
      return cachedPrice;
    }

    const price = await this.dataApiService.getEgldPrice(date.getTime() / 1000);
    if (price) {
      await this.cachingService.set(cacheKey, price, Constants.oneDay() * 7);
    }

    return price;
  }
}
