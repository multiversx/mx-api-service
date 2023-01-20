import { TransactionDetails } from "./transaction.details";

export class Transaction {
  tx: TransactionDetails = new TransactionDetails();
  hash: string = '';
  data: string = '';
}
