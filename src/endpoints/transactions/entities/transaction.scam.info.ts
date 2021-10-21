import { TransactionScamType } from "src/common/external/entities/transaction.scam.type";

export class TransactionScamInfo {
  type: TransactionScamType = TransactionScamType.none;
  info?: string | null;
}