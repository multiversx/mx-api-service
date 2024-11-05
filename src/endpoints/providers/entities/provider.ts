
import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { NodesInfos } from "./nodes.infos";
import { Identity } from "src/endpoints/identities/entities/identity";

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

  @ApiProperty({ type: String, nullable: true, required: false })
  identity: string | undefined = undefined;

  @ApiProperty({ type: String })
  initialOwnerFunds: string | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false })
  automaticActivation: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false })
  checkCapOnRedelegate: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false })
  ownerBelowRequiredBalanceThreshold: boolean | undefined = undefined;

  @ApiProperty({ type: String })
  totalUnStaked: string | undefined = undefined;

  @ApiProperty({ type: Number })
  createdNonce: number | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true, required: false })
  githubProfileValidated: boolean | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  githubProfileValidatedAt: string | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true, required: false })
  githubKeysValidated: boolean | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  githubKeysValidatedAt: string | undefined = undefined;

  @ApiProperty({ type: Identity, nullable: true, required: false })
  identityInfo?: Identity;
}
