import { ApiProperty } from "@nestjs/swagger";
import { UnsignedTransaction } from "./transaction.unsigned";

export class SignedTransaction extends UnsignedTransaction {
  @ApiProperty()
  signature: string = '';
}
