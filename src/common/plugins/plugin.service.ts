import { Injectable } from "@nestjs/common";
import { Account } from "src/endpoints/accounts/entities/account";
import { Nft } from "src/endpoints/nfts/entities/nft";
import { Transaction } from "src/endpoints/transactions/entities/transaction";

@Injectable()
export class PluginService {
  async processTransaction(_: Transaction): Promise<void> { }

  async handleEveryMinuteCron(): Promise<void> { }

  async processTransactionSend(_: any): Promise<any> { }

  async processNft(_: Nft): Promise<void> { }

  async processAccount(_: Account): Promise<void> { }
}