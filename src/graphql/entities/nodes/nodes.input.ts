import { Field, Float, InputType } from "@nestjs/graphql";
import { SortOrder } from "src/common/entities/sort.order";
import { NodeFilter } from "src/endpoints/nodes/entities/node.filter";
import { NodeSort } from "src/endpoints/nodes/entities/node.sort";
import { NodeStatus } from "src/endpoints/nodes/entities/node.status";
import { NodeType } from "src/endpoints/nodes/entities/node.type";

@InputType({ description: "Input to retreive the given nodes count for." })
export class GetNodesCountInput {
  constructor(partial?: Partial<GetNodesCountInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "search", description: "Search for the given result set.", nullable: true })
  search: string | undefined = undefined;

  @Field(() => Boolean, { name: "online", description: "Online filter for the given result set.", nullable: true })
  online: boolean | undefined = undefined;

  @Field(() => NodeType, { name: "type", description: "Type filter for the given result set.", nullable: true })
  type: NodeType | undefined = undefined;

  @Field(() => NodeStatus, { name: "status", description: "Status filter for the given result set.", nullable: true })
  status: NodeStatus | undefined = undefined;

  @Field(() => Float, { name: "shard", description: "Shard ID for the given result set.", nullable: true })
  shard: number | undefined = undefined;

  @Field(() => Boolean, { name: "issues", description: "Issues filter for the given result set.", nullable: true })
  issues: boolean | undefined = undefined;

  @Field(() => String, { name: "identity", description: "Identity filter for the given result set.", nullable: true })
  identity: string | undefined = undefined;

  @Field(() => String, { name: "provider", description: "Provider filter for the given result set.", nullable: true })
  provider: string | undefined = undefined;

  @Field(() => String, { name: "owner", description: "Owner filter for the given result set.", nullable: true })
  owner: string | undefined = undefined;

  @Field(() => Boolean, { name: "auctioned", description: "Auctioned filter for the given result set.", nullable: true })
  auctioned: boolean | undefined = undefined;

  @Field(() => Boolean, { name: "fullHistory", description: "FullHistory filter for the given result set.", nullable: true })
  fullHistory: boolean | undefined = undefined;

  @Field(() => NodeSort, { name: "sort", description: "Sort filter for the given result set.", nullable: true })
  sort: NodeSort | undefined = undefined;

  @Field(() => SortOrder, { name: "order", description: "Order filter for the given result set.", nullable: true })
  order: SortOrder | undefined = undefined;

  public static resolve(input: GetNodesCountInput): NodeFilter {
    return new NodeFilter({
      search: input.search,
      online: input.online,
      type: input.type,
      status: input.status,
      shard: input.shard,
      issues: input.issues,
      identity: input.identity,
      provider: input.provider,
      owner: input.owner,
      auctioned: input.auctioned,
      fullHistory: input.fullHistory,
      sort: input.sort,
      order: input.order,
    });
  }
}

@InputType({ description: "Input to retrieve the given nodes for." })
export class GetNodesInput extends GetNodesCountInput {
  constructor(partial?: Partial<GetNodesInput>) {
    super();

    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of blocks to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of blocks to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;
}
