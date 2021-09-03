import { ExtrasApiTransactionScamType } from './transaction-scam-type.enum';

export class ExtrasApiScamTransactionResult {
  type: ExtrasApiTransactionScamType = ExtrasApiTransactionScamType.none;
  info?: string | null;
}