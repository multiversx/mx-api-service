import { QueryBase } from "src/common/entities/query.base";
import { NodeStatus } from "./node.status";
import { NodeType } from "./node.type";

export class NodeQuery extends QueryBase {
  search: string | undefined; 
  online: boolean | undefined; 
  type: NodeType | undefined;
  status: NodeStatus | undefined;
  shard: number | undefined;
  issues: boolean | undefined;
  identity: string | undefined;
  provider: string | undefined;
  owner: string | undefined;
} 