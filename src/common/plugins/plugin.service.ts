import { Injectable } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { Transaction } from "src/endpoints/transactions/entities/transaction";

@Injectable()
export class PluginService {
  async processTransaction(_transaction: Transaction, _withScamInfo?: boolean): Promise<void> { }

  async processTransactionSend(_transaction: any): Promise<any> { }

  async processNft(_nft: Nft): Promise<void> { }

  async batchProcessNfts(_nft: Nft[], _withScamInfo?: boolean): Promise<void> { }

  async processAccount(_account: AccountDetailed): Promise<void> { }

  async bootstrapPublicApp(_application: NestExpressApplication): Promise<void> { }
}
