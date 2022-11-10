import { Constants, CachingService } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheInfo } from "src/utils/cache.info";
import { TransactionDetailed } from "./entities/transaction.detailed";
import { PluginService } from "src/common/plugins/plugin.service";

@Injectable()
export class TransactionPriceService {

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    private readonly pluginsService: PluginService,
  ) { }

  async getTransactionPrice(transaction: TransactionDetailed): Promise<number | undefined> {
    const dataUrl = this.apiConfigService.getDataApiUrl();
    if (!dataUrl) {
      return undefined;
    }

    const transactionDate = transaction.getDate();
    if (!transactionDate) {
      return undefined;
    }

    if (transactionDate.isLessThan(new Date(2020, 9, 10))) {
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
    return await this.cachingService.getOrSetCache(
      CacheInfo.CurrentPrice.key,
      async () => await this.pluginsService.getEgldPrice(),
      CacheInfo.CurrentPrice.ttl
    );
  }

  private async getTransactionPriceHistorical(date: Date): Promise<number | undefined> {
    return await this.cachingService.getOrSetCache(
      `price:${date.toISODateString()}`,
      async () => await this.pluginsService.getEgldPrice(date.getTime() / 1000),
      Constants.oneDay() * 7
    );
  }
}
