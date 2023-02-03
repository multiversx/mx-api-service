import { Constants, CachingService } from "@multiversx/sdk-nestjs";
import { Injectable } from "@nestjs/common";
import { CacheInfo } from "src/utils/cache.info";
import { TransactionDetailed } from "./entities/transaction.detailed";
import { PluginService } from "src/common/plugins/plugin.service";

@Injectable()
export class TransactionPriceService {

  constructor(
    private readonly cachingService: CachingService,
    private readonly pluginsService: PluginService,
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
    const cachedPrice = await this.cachingService.getCache<number | undefined>(CacheInfo.CurrentPrice.key);
    if (cachedPrice) {
      return cachedPrice;
    }

    const price = await this.pluginsService.getEgldPrice();
    if (price) {
      await this.cachingService.setCache(CacheInfo.CurrentPrice.key, price, CacheInfo.CurrentPrice.ttl);
    }

    return price;
  }

  private async getTransactionPriceHistorical(date: Date): Promise<number | undefined> {
    const cacheKey = `price:${date.toISODateString()}`;

    const cachedPrice = await this.cachingService.getCache<number | undefined>(cacheKey);
    if (cachedPrice) {
      return cachedPrice;
    }

    const price = await this.pluginsService.getEgldPrice(date.getTime() / 1000);
    if (price) {
      await this.cachingService.setCache(cacheKey, price, Constants.oneDay() * 7);
    }

    return price;
  }
}
