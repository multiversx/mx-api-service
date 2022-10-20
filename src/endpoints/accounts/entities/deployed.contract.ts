import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";

export class DeployedContract {
  constructor(init?: Partial<DeployedContract>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  address: string = "";

  @ApiProperty({ type: String })
  deployTxHash: string = "";

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Account assets' })
  assets: AccountAssets | undefined = undefined;
}
