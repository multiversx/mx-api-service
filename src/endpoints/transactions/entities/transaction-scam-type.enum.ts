import { ExtrasApiTransactionScamType } from "src/common/external-dtos/extras-api";

export enum TransactionScamType {
  none = 'none',
  potentialScam = 'potentialScam',
  scam = 'scam'
}

export const mapTransactionScamTypeFromExtrasApi = (type: ExtrasApiTransactionScamType | null): TransactionScamType => {
  switch (type) {
    case ExtrasApiTransactionScamType.none:
      return TransactionScamType.none;
    case ExtrasApiTransactionScamType.potentialScam:
      return TransactionScamType.potentialScam;
    case ExtrasApiTransactionScamType.scam:
      return TransactionScamType.scam;
    default:
      return TransactionScamType.none;
  }
}