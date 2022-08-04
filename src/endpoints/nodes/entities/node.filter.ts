import { SortOrder } from "src/common/entities/sort.order";
import { NodeStatus } from "./node.status";
import { NodeType } from "./node.type";
import { NodeSort } from "./node.sort";

export class NodeFilter {
  constructor(init?: Partial<NodeFilter>) {
    Object.assign(this, init);
  }

  search: string | undefined;
  online: boolean | undefined;
  type: NodeType | undefined;
  status: NodeStatus | undefined;
  shard: number | undefined;
  issues: boolean | undefined;
  identity: string | undefined;
  provider: string | undefined;
  owner: string | undefined;
  auctioned: boolean | undefined;
  fullHistory: boolean | undefined;
  sort: NodeSort | undefined;
  order: SortOrder | undefined;
} 
