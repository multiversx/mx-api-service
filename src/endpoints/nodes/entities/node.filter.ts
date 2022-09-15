import { SortOrder } from "src/common/entities/sort.order";
import { NodeStatus } from "./node.status";
import { NodeType } from "./node.type";
import { NodeSort } from "./node.sort";
import { Field, Float, ObjectType } from "@nestjs/graphql";

@ObjectType("NodeFilter", { description: "NodeFilter object type." })
export class NodeFilter {
  constructor(init?: Partial<NodeFilter>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Identifier for the given NFT.", nullable: true })
  search: string | undefined;

  @Field(() => Boolean, { description: "Identifier for the given NFT.", nullable: true })
  online: boolean | undefined;

  @Field(() => NodeType, { description: "Identifier for the given NFT.", nullable: true })
  type: NodeType | undefined;

  @Field(() => NodeStatus, { description: "Identifier for the given NFT.", nullable: true })
  status: NodeStatus | undefined;

  @Field(() => Float, { description: "Identifier for the given NFT.", nullable: true })
  shard: number | undefined;

  @Field(() => Boolean, { description: "Identifier for the given NFT.", nullable: true })
  issues: boolean | undefined;

  @Field(() => String, { description: "Identifier for the given NFT.", nullable: true })
  identity: string | undefined;

  @Field(() => String, { description: "Identifier for the given NFT.", nullable: true })
  provider: string | undefined;

  @Field(() => String, { description: "Identifier for the given NFT.", nullable: true })
  owner: string | undefined;

  @Field(() => Boolean, { description: "Identifier for the given NFT.", nullable: true })
  auctioned: boolean | undefined;

  @Field(() => Boolean, { description: "Identifier for the given NFT.", nullable: true })
  fullHistory: boolean | undefined;

  @Field(() => NodeSort, { description: "Identifier for the given NFT.", nullable: true })
  sort: NodeSort | undefined;

  @Field(() => SortOrder, { description: "Identifier for the given NFT.", nullable: true })
  order: SortOrder | undefined;
} 
