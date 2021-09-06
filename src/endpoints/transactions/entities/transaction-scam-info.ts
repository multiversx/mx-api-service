import { TransactionScamType } from './transaction-scam-type.enum';

export class TransactionScamInfo {
  type: TransactionScamType = TransactionScamType.none;
  info?: string | null;
}