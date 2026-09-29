import { ApiProperty } from "@nestjs/swagger";

export class TransactionPoolTooLarge {
  @ApiProperty({ type: Boolean, example: true, description: 'Set only when the transaction pool is too large to be displayed' })
  tooLarge: boolean = true;

  @ApiProperty({ type: String, example: 'The transaction pool is too large to be displayed' })
  message: string = 'The transaction pool is too large to be displayed';
}
