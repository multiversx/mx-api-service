import { TokenTransferProperties } from "src/endpoints/tokens/entities/token.transfer.properties";

export class TransactionMetadataTransfer {
  constructor(init?: Partial<TransactionMetadataTransfer>) {
    Object.assign(this, init);
  }

  properties?: TokenTransferProperties;

  value: BigInt = BigInt(0);
}
