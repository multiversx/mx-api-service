import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { NodeStatus } from "./node.status";
import { NodeType } from "./node.type";

@ObjectType("Node", { description: "Node object type." })
export class Node {
  constructor(init?: Partial<Node>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Bls address for the given node." })
  @ApiProperty({ type: String })
  bls: string = '';

  @Field(() => String, { description: "Name for the given node." })
  @ApiProperty({ type: String })
  name: string = '';

  @Field(() => String, { description: "Version for the given node." })
  @ApiProperty({ type: String, default: 0 })
  version: string = '';

  @Field(() => Float, { description: "Rating for the given node." })
  @ApiProperty({ type: Number })
  rating: number = 0;

  @Field(() => Float, { description: "Temp rating for the given node." })
  @ApiProperty({ type: Number })
  tempRating: number = 0;

  @Field(() => Float, { description: "Rating modifier for the given node." })
  @ApiProperty({ type: Number })
  ratingModifier: number = 0;

  @Field(() => Float, { description: "Shard for the given node.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  shard: number | undefined = undefined;

  @Field(() => NodeType, { description: "Type for the given node.", nullable: true })
  @ApiProperty({ enum: NodeType, nullable: true })
  type: NodeType | undefined = undefined;

  @Field(() => NodeStatus, { description: "Status for the given node.", nullable: true })
  @ApiProperty({ enum: NodeStatus, nullable: true })
  status: NodeStatus | undefined = undefined;

  @Field(() => Boolean, { description: "Online for the given node." })
  @ApiProperty({ type: Boolean, default: false })
  online: boolean = false;

  @Field(() => Float, { description: "Nonce for the given node." })
  @ApiProperty({ type: Number })
  nonce: number = 0;

  @Field(() => Float, { description: "Instances for the given node." })
  @ApiProperty({ type: Number })
  instances: number = 0;

  @Field(() => String, { description: "Owner for the given node." })
  @ApiProperty({ type: String })
  owner: string = '';

  @Field(() => String, { description: "Identity for the given node.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  identity: string | undefined = undefined;

  @Field(() => String, { description: "Provider for the given node." })
  @ApiProperty({ type: String })
  provider: string = '';

  @Field(() => [String], { description: "Issues for the given node." })
  @ApiProperty({ type: [String] })
  issues: string[] = [];

  @Field(() => String, { description: "Stake for the given node." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  stake: string = '';

  @Field(() => String, { description: "Top up for the given node." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  topUp: string = '';

  @Field(() => String, { description: "Locked details for the given node." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  locked: string = '';

  @Field(() => Float, { description: "Leader failure for the given node." })
  @ApiProperty({ type: Number, default: 0 })
  leaderFailure: number = 0;

  @Field(() => Float, { description: "Leader success for the given node." })
  @ApiProperty({ type: Number, default: 15 })
  leaderSuccess: number = 0;

  @Field(() => Float, { description: "Validator failure for the given node." })
  @ApiProperty({ type: Number, default: 0 })
  validatorFailure: number = 0;

  @Field(() => Float, { description: "Validator ignored signatures details for the given node." })
  @ApiProperty({ type: Number, default: 0 })
  validatorIgnoredSignatures: number = 0;

  @Field(() => Float, { description: "Bls address for the given node." })
  @ApiProperty({ type: Number, default: 10000 })
  validatorSuccess: number = 0;

  @Field(() => Float, { description: "Bls address for the given node." })
  @ApiProperty({ type: Number, default: 0 })
  position: number = 0;

  @Field(() => Boolean, { description: "Auctioned detailes for the given node.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  auctioned: boolean | undefined = undefined;

  @Field(() => Number, { description: "Auction position for the given node.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  auctionPosition: number | undefined = undefined;

  @Field(() => String, { description: "Auction top up for the given node.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  auctionTopUp: string | undefined = undefined;

  @Field(() => Boolean, { description: "Auction selected for the given node.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  auctionSelected: boolean | undefined = undefined;

  @Field(() => Boolean, { description: "Full history details for the given node.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  fullHistory: boolean | undefined = undefined;
}
