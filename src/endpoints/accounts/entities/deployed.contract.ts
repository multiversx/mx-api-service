import { ApiProperty } from "@nestjs/swagger";

export class DeployedContract {
  @ApiProperty({ type: String })
  address: string = "";

  @ApiProperty({ type: String })
  deployTxHash: string = "";

  @ApiProperty({ type: Number })
  timestamp: number = 0;
}
