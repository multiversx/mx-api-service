import { ApiProperty } from "@nestjs/swagger";
import { TransactionAction } from "../transaction-action/entities/transaction.action";
import { UnsignedTransaction } from "./transaction.unsigned";

export class TransactionDecodeResult extends UnsignedTransaction {
  @ApiProperty()
  action?: TransactionAction;
}
