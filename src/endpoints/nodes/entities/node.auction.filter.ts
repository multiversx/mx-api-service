import { SortOrder } from "src/common/entities/sort.order";
import { NodeSortAuction } from "./node.sort.auction";

export class NodeAuctionFilter {
  constructor(init?: Partial<NodeAuctionFilter>) {
    Object.assign(this, init);
  }

  search: string | undefined;

  sort: NodeSortAuction | undefined;

  order: SortOrder | undefined;
}
