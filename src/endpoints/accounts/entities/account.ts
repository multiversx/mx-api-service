import { ApiProperty } from "@nestjs/swagger";

export class Account {
  @ApiProperty({ type: String })
  address: string = '';

  @ApiProperty({ type: String })
  balance: string = '';

  @ApiProperty({ type: Number })
  nonce: number = 0;

  @ApiProperty({ type: Number })
  shard: number = 0;

  @ApiProperty({ type: Object, nullable: true })
  scamInfo: any | undefined = undefined;
}
