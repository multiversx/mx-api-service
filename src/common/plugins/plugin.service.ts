import { Injectable } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { About } from "src/endpoints/network/entities/about";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { Transaction } from "src/endpoints/transactions/entities/transaction";

@Injectable()
export class PluginService {
  async processTransactions(_transactions: Transaction[], _withScamInfo?: boolean): Promise<void> { }

  async processTransactionSend(_transaction: any): Promise<any> { }

  async processAccount(_account: AccountDetailed): Promise<void> { }

  async bootstrapPublicApp(_application: NestExpressApplication): Promise<void> { }

  async batchProcessNfts(_nfts: Nft[], _withScamInfo?: boolean): Promise<void> { }

  async processAbout(_about: About): Promise<void> { }
}
