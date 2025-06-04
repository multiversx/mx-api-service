import { Injectable, Logger } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { About } from "src/endpoints/network/entities/about";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { Transaction } from "src/endpoints/transactions/entities/transaction";

export interface IPlugin {
  name: string;
  version: string;
  processTransactions?(transactions: Transaction[], withScamInfo?: boolean): Promise<void>;
  processTransactionSend?(transaction: any): Promise<any>;
  processAccount?(account: AccountDetailed): Promise<void>;
  bootstrapPublicApp?(application: NestExpressApplication): Promise<void>;
  batchProcessNfts?(nfts: Nft[], withScamInfo?: boolean): Promise<void>;
  processAbout?(about: About): Promise<void>;
}

@Injectable()
export class PluginService {
  private readonly logger = new Logger(PluginService.name);
  private plugins: IPlugin[] = [];

  registerPlugins(plugins: IPlugin[]) {
    for (const plugin of plugins) {
      try {
        if (!plugin.name || !plugin.version) {
          throw new Error('Plugin must have name and version');
        }
        this.plugins.push(plugin);
        this.logger.log(`Registered plugin: ${plugin.name} v${plugin.version}`);
      } catch (err) {
        this.logger.error(`Failed to register plugin:`, err);
      }
    }
  }

  private async executePluginMethod<T>(methodName: keyof IPlugin, ...args: any[]): Promise<void> {
    for (const plugin of this.plugins) {
      const method = plugin[methodName] as Function;
      if (method) {
        try {
          await method.apply(plugin, args);
        } catch (err) {
          this.logger.error(`Error in plugin ${plugin.name} method ${methodName}:`, err);
        }
      }
    }
  }

  async processTransactions(transactions: Transaction[], withScamInfo?: boolean): Promise<void> {
    await this.executePluginMethod('processTransactions', transactions, withScamInfo);
  }

  async processTransactionSend(transaction: any): Promise<any> {
    let result = transaction;
    for (const plugin of this.plugins) {
      if (plugin.processTransactionSend) {
        try {
          result = await plugin.processTransactionSend(result);
        } catch (err) {
          this.logger.error(`Error in plugin ${plugin.name} processTransactionSend:`, err);
        }
      }
    }
    return result;
  }

  async processAccount(account: AccountDetailed): Promise<void> {
    await this.executePluginMethod('processAccount', account);
  }

  async bootstrapPublicApp(application: NestExpressApplication): Promise<void> {
    await this.executePluginMethod('bootstrapPublicApp', application);
  }

  async batchProcessNfts(nfts: Nft[], withScamInfo?: boolean): Promise<void> {
    await this.executePluginMethod('batchProcessNfts', nfts, withScamInfo);
  }

  async processAbout(about: About): Promise<void> {
    await this.executePluginMethod('processAbout', about);
  }
}
