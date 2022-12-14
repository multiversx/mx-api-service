import { ApiProperty } from "@nestjs/swagger";
import { ScDeployUpgrade } from "src/common/indexer/entities/sc.deploy";

export class ContractUpgrades {
  constructor(init?: Partial<ContractUpgrades>) {
    Object.assign(this, init);
  }
  @ApiProperty({ type: String })
  contract: string = "";

  @ApiProperty({ type: String })
  deployer: string = "";

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: Number })
  upgrades: ScDeployUpgrade[] = [];
}
