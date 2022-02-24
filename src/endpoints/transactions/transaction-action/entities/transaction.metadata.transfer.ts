import { TokenTransferProperties } from "src/endpoints/tokens/entities/token.transfer.properties";

export class TransactionMetadataTransfer {
  properties?: TokenTransferProperties;

  value: BigInt = BigInt(0);
}
