import { Injectable } from "@nestjs/common";
import { Transaction } from "src/endpoints/transactions/entities/transaction";

@Injectable()
export class PluginService {
  // @ts-ignore
  async processTransaction(transaction: Transaction): Promise<void> {}
}