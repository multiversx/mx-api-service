import { ApiProperty } from "@nestjs/swagger";
import { TransactionAction } from "../../transaction-action/entities/transaction.action";

export class TransactionDecodeDto {
  constructor(init?: Partial<TransactionDecodeDto>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: TransactionAction, nullable: true })
  action: TransactionAction | undefined = new TransactionAction();

  @ApiProperty({ type: String })
  data: string = '';

  @ApiProperty({ type: String })
  receiver: string = '';

  @ApiProperty({ type: String })
  sender: string = '';

  @ApiProperty({ type: String })
  value: string = '';
}
