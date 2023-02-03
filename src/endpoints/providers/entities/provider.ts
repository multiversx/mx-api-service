
import { SwaggerUtils } from "@multiversx/sdk-nestjs";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { NodesInfos } from "./nodes.infos";

@ObjectType("Provider", { description: "Provider object type." })
export class Provider extends NodesInfos {
  constructor(init?: Partial<Provider>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Provider address details." })
  @ApiProperty({ type: String })
  provider: string = '';

  @Field(() => String, { description: "Owner address details.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  owner: string | null = null;

  @Field(() => Boolean, { description: "Featured details." })
  @ApiProperty({ type: Boolean, default: false })
  featured: boolean = false;

  @Field(() => Float, { description: "Service fee details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  serviceFee: number = 0;

  @Field(() => String, { description: "Delegation cap details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  delegationCap: string = '';

  @Field(() => Float, { description: "APR details percentage." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  apr: number = 0;

  @Field(() => Float, { description: "Total number of users." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  numUsers: number = 0;

  @Field(() => String, { description: "Provider cumulated rewards.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  cumulatedRewards: string | null = null;

  @Field(() => String, { description: "Provider identity.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  identity: string | undefined = undefined;

  @ApiProperty({ type: String })
  initialOwnerFunds?: string = "";

  @ApiProperty({ type: Boolean, default: false })
  automaticActivation?: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  checkCapOnRedelegate?: boolean = false;

  @ApiProperty({ type: String })
  totalUnStaked?: string = "";

  @ApiProperty({ type: Number })
  createdNonce?: number = 0;
}
