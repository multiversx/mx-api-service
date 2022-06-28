import { SwaggerUtils } from 'src/utils/swagger.utils';
import { ApiProperty } from "@nestjs/swagger";
import { NodesInfos } from "./nodes.infos";

export class Provider extends NodesInfos {
  constructor(init?: Partial<Provider>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  provider: string = '';

  @ApiProperty({ type: String, nullable: true })
  owner: string | null = null;

  @ApiProperty({ type: Boolean, default: false })
  featured: boolean = false;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  serviceFee: number = 0;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  delegationCap: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  apr: number = 0;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  numUsers: number = 0;

  @ApiProperty({ type: String, nullable: true })
  cumulatedRewards: string | null = null;

  @ApiProperty({ type: String, nullable: true })
  identity: string | undefined = undefined;
}
