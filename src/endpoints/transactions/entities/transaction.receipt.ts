import { ApiProperty } from "@nestjs/swagger";

export class TransactionReceipt {
  constructor(init?: Partial<TransactionReceipt>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  value: string = '';

  @ApiProperty()
  sender: string = '';

  @ApiProperty()
  data: string = '';
}
