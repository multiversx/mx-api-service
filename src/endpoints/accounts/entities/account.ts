import { ApiProperty } from "@nestjs/swagger";
import { ScamType } from "src/plugins/shared/scam/entities/scam-type.enum";

export class Account {
  @ApiProperty({ description: 'The address of the account' })
  address: string = '';

  @ApiProperty({ description: 'The current balance of the account (must be denominated to obtain the real value)' })
  balance: string = '';

  @ApiProperty({ description: 'The current nonce of the account' })
  nonce: string = '';

  @ApiProperty({ description: 'The shard identifier of the account' })
  shard: number = 0;

  @ApiProperty({ enum: ScamType })
  scamInfo: any | undefined = undefined;
}
