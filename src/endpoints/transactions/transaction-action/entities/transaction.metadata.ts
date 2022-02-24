import { Injectable } from "@nestjs/common";
import { TransactionMetadataTransfer } from "./transaction.metadata.transfer";

@Injectable()
export class TransactionMetadata {
  sender: string = '';
  receiver: string = '';
  value: BigInt = BigInt(0);
  functionName?: string;
  functionArgs: string[] = [];

  transfers?: TransactionMetadataTransfer[];
}
