import { Injectable } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { NftCollection } from "src/endpoints/collections/entities/nft.collection";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { Transaction } from "src/endpoints/transactions/entities/transaction";

@Injectable()
export class PluginService {
  async processTransactions(_transactions: Transaction[], _withScamInfo?: boolean, _withEsdtPrices?: boolean): Promise<void> { }

  async processTransactionSend(_transaction: any): Promise<any> { }

  async processNfts(_nft: Nft[], _withScamInfo?: boolean): Promise<void> { }

  async processCollections(_collections: NftCollection[]): Promise<void> { }

  async processAccount(_account: AccountDetailed): Promise<void> { }

  async bootstrapPublicApp(_application: NestExpressApplication): Promise<void> { }

  async batchProcessNfts(_nfts: Nft[], _withScamInfo?: boolean): Promise<void> { }
}
