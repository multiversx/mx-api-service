import { Injectable } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { Transaction } from "src/endpoints/transactions/entities/transaction";

@Injectable()
export class PluginService {
  async processTransaction(_: Transaction): Promise<void> { }

  async processTransactionSend(_: any): Promise<any> { }

  async processNft(_: Nft): Promise<void> { }

  async batchProcessNfts(_: Nft[], __?: boolean | undefined): Promise<void> { }

  async processAccount(_: AccountDetailed): Promise<void> { }

  async bootstrapPublicApp(_: NestExpressApplication): Promise<void> { }
}
