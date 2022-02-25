import { ApiProperty } from "@nestjs/swagger";
import { TransactionAction } from "../../transaction-action/entities/transaction.action";

export class TransactionDecodeDto {
  @ApiProperty()
  action: TransactionAction | undefined = new TransactionAction();

  @ApiProperty()
  data: string = '';

  @ApiProperty()
  receiver: string = '';

  @ApiProperty()
  sender: string = '';

  @ApiProperty()
  value: string = '';
}
