import { SortOrder } from "src/common/entities/sort.order";
import { NodeSort } from "./node.sort";
import { Field, ObjectType } from "@nestjs/graphql";
import { NodeSortAuction } from "./node.sort.auction";

@ObjectType("NodeAuctionFilter", { description: "NodeAuctionFilter object type." })
export class NodeAuctionFilter {
  constructor(init?: Partial<NodeAuctionFilter>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Search filter for the given nodes.", nullable: true })
  search: string | undefined;

  @Field(() => NodeSort, { description: "Node sort filter.", nullable: true })
  sort: NodeSortAuction | undefined;

  @Field(() => SortOrder, { description: "Node order filter .", nullable: true })
  order: SortOrder | undefined;
}
