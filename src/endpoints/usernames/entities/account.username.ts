import { SwaggerUtils } from "@elrondnetwork/nestjs-microservice-template";
import { ApiProperty } from "@nestjs/swagger";

export class AccountUsername {
  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @ApiProperty({ type: Number, example: 12, nullable: true })
  nonce: number | undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = '';

  @ApiProperty({ type: String, example: '829LsRk/pB5HCJZTvZzkBJ8g4ca1RiBpYjLzzK61pwM=' })
  rootHash: string = '';

  @ApiProperty({ type: Number, example: 47, nullable: true })
  txCount: number | undefined;

  @ApiProperty({ type: Number, example: 49, nullable: true })
  scrCount: number | undefined;

  @ApiProperty({ type: String, example: 'alice.elrond' })
  username: string = '';

  @ApiProperty({ type: Number, example: 0, nullable: true })
  shard: number | undefined;

  @ApiProperty({ type: String, default: 0 })
  developerReward: string = '';
}
