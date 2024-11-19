import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { NodeStatus } from "./node.status";
import { NodeType } from "./node.type";
import { Identity } from "src/endpoints/identities/entities/identity";

export class Node {
  constructor(init?: Partial<Node>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  bls: string = '';

  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: String, default: 0 })
  version: string = '';

  @ApiProperty({ type: Number })
  rating: number = 0;

  @ApiProperty({ type: Number })
  tempRating: number = 0;

  @ApiProperty({ type: Number })
  ratingModifier: number = 0;

  @ApiProperty({ type: Number, nullable: true })
  shard: number | undefined = undefined;

  @ApiProperty({ enum: NodeType, nullable: true })
  type: NodeType | undefined = undefined;

  @ApiProperty({ enum: NodeStatus, nullable: true })
  status: NodeStatus | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false })
  online: boolean = false;

  @ApiProperty({ type: Number })
  nonce: number = 0;

  @ApiProperty({ type: Number })
  instances: number = 0;

  @ApiProperty({ type: String })
  owner: string = '';

  @ApiProperty({ type: String, nullable: true })
  identity: string | undefined = undefined;

  @ApiProperty({ type: String })
  provider: string = '';

  @ApiProperty({ type: [String] })
  issues: string[] = [];

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  stake: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  topUp: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  locked: string = '';

  @ApiProperty({ type: Number, default: 0 })
  leaderFailure: number = 0;

  @ApiProperty({ type: Number, default: 15 })
  leaderSuccess: number = 0;

  @ApiProperty({ type: Number, default: 0 })
  validatorFailure: number = 0;

  @ApiProperty({ type: Number, default: 0 })
  validatorIgnoredSignatures: number = 0;

  @ApiProperty({ type: Number, default: 10000 })
  validatorSuccess: number = 0;

  @ApiProperty({ type: Number, default: 0 })
  position: number = 0;

  @ApiProperty({ type: Boolean, nullable: true })
  auctioned: boolean | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  auctionPosition: number | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  auctionTopUp: string | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  auctionQualified: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  fullHistory: boolean | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  syncProgress: number | undefined = undefined;

  @ApiProperty({ type: Number, example: 10 })
  remainingUnBondPeriod: number | undefined = undefined;

  @ApiProperty({ type: Boolean, example: false })
  isInDangerZone: boolean | undefined = undefined;

  @ApiProperty({ type: Number, example: 15 })
  epochsLeft: number | undefined = undefined;

  @ApiProperty({ type: Identity, nullable: true, required: false })
  identityInfo?: Identity;

  @ApiProperty({ type: String, default: 0 })
  qualifiedStake: string = '';
}
