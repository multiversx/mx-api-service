import { ApiProperty } from "@nestjs/swagger";

export class TransactionAction {
  @ApiProperty({ type: String })
  category: string = '';

  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: String })
  description: string = '';

  @ApiProperty()
  arguments?: { [key: string]: any };
}
