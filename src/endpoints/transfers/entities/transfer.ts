import { ApiProperty } from "@nestjs/swagger";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransferType } from "./transfer.type";

export class Transfer extends Transaction {
  @ApiProperty()
  type: TransferType = TransferType.Transaction;
}
