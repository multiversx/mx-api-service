import { TransactionScamType } from './transaction.scam.type';

export class TransactionScamResult {
  type: TransactionScamType = TransactionScamType.none;
  info?: string | null;
}