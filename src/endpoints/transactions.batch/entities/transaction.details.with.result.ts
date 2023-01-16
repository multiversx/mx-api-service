import { TransactionDetails } from "./transaction.details";

export class TransactionDetailsWithResult extends TransactionDetails {
  hash?: string;

  status?: string;

  error?: string;
}
