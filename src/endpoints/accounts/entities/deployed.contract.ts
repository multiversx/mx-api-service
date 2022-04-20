import { ApiProperty } from "@nestjs/swagger";

export class DeployedContract {
  @ApiProperty()
  address: string = "";

  @ApiProperty()
  deployTxHash: string = "";

  @ApiProperty()
  timestamp: number = 0;
}
