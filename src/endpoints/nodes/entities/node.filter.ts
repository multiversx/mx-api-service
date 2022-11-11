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

  @Field(() => String, { description: "Search filter for the given nodes.", nullable: true })
  search: string | undefined;

  @Field(() => Boolean, { description: "Online status filter for the given nodes.", nullable: true })
  online: boolean | undefined;

  @Field(() => NodeType, { description: "Node type filter for the given nodes.", nullable: true })
  type: NodeType | undefined;

  @Field(() => NodeStatus, { description: "Node status filter for the given nodes.", nullable: true })
  status: NodeStatus | undefined;

  @Field(() => Float, { description: "Shard filter for the given nodes.", nullable: true })
  shard: number | undefined;

  @Field(() => Boolean, { description: "Node issues filter for the given nodes.", nullable: true })
  issues: boolean | undefined;

  @Field(() => String, { description: "Identity filter for the given nodes.", nullable: true })
  identity: string | undefined;

  @Field(() => String, { description: "Provider filter for the given nodes.", nullable: true })
  provider: string | undefined;

  @Field(() => String, { description: "Owner node filter address.", nullable: true })
  owner: string | undefined;

  @Field(() => Boolean, { description: "Auctioned filter for the given nodes.", nullable: true })
  auctioned: boolean | undefined;

  @Field(() => Boolean, { description: "Full history node filter for the given nodes.", nullable: true })
  fullHistory: boolean | undefined;

  @Field(() => NodeSort, { description: "Node sort filter.", nullable: true })
  sort: NodeSort | undefined;

  @Field(() => SortOrder, { description: "Node order filter .", nullable: true })
  order: SortOrder | undefined;
} 
