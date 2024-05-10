import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("GlobalStake", { description: "GlobalStake object type." })
export class GlobalStake {
  constructor(init?: Partial<GlobalStake>) {
    Object.assign(this, init);
  }

  @Field(() => Float, { description: "Total validators." })
  @ApiProperty({ type: Number, default: 3200 })
  totalValidators: number = 0;

  @Field(() => Float, { description: "Active validators." })
  @ApiProperty({ type: Number, default: 3199 })
  activeValidators: number = 0;

  @Field(() => Float, { description: "Validators queue size." })
  @ApiProperty({ type: Number, default: 2 })
  queueSize: number = 0;

  @Field(() => Float, { description: "Total stake amount." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalStaked: string = '';

  @Field(() => String, { description: "Minimum Auction Qualified Top Up information.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  minimumAuctionQualifiedTopUp: string | undefined = undefined;

  @Field(() => String, { description: "Minimum Auction Qualified Stake information.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  minimumAuctionQualifiedStake: string | undefined = undefined;

  @Field(() => Float, { description: "Auction Validators." })
  @ApiProperty({ type: Number, nullable: true })
  auctionValidators: number | undefined = undefined;

  @Field(() => Float, { description: "Nakamoto Coefficient." })
  @ApiProperty({ type: Number, nullable: true })
  nakamotoCoefficient: number | undefined = undefined;

  @Field(() => Float, { description: "Danger Zone Validators." })
  @ApiProperty({ type: Number, nullable: true })
  dangerZoneValidators: number | undefined = undefined;

  @Field(() => Float, { description: "Eligible Validators." })
  @ApiProperty({ type: Number, nullable: true })
  eligibleValidators: number | undefined = undefined;

  @Field(() => Float, { description: "Not Eligible Validators." })
  @ApiProperty({ type: Number, nullable: true })
  waitingValidators: number | undefined = undefined;

  @Field(() => Float, { description: "Qualified Auction Validators." })
  @ApiProperty({ type: Number, nullable: true })
  qualifiedAuctionValidators: number | undefined = undefined;

  @Field(() => Float, { description: "All Staked Nodes." })
  @ApiProperty({ type: Number, nullable: true })
  allStakedNodes: number | undefined = undefined;
}
