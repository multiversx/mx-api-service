import { ApiProperty } from "@nestjs/swagger";

export class TransactionDetailedToken {
  @ApiProperty({ description: 'The token identifier' })
  identifier: string = '';

  @ApiProperty({ description: 'The transferred amount' })
  value: string = '';
}