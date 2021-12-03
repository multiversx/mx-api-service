import { Injectable } from "@nestjs/common";
import { Transaction } from "src/endpoints/transactions/entities/transaction";

@Injectable()
export class PluginService {
  async processTransaction(_: Transaction): Promise<void> {}

  async handleEveryMinuteCron(): Promise<void> {}

  async processTransactionSend(_: any): Promise<any> {}
}