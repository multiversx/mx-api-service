import { ApiProperty } from "@nestjs/swagger";
import { SwaggerUtils } from "src/utils/swagger.utils";

export class Account {
  @ApiProperty({ type: String })
  address: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = '';

  @ApiProperty({ type: Number })
  nonce: number = 0;

  @ApiProperty({ type: Number })
  shard: number = 0;

  @ApiProperty({ type: Object, nullable: true })
  scamInfo: any | undefined = undefined;
}
