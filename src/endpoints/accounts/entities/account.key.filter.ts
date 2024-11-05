
import { NodeStatusRaw } from "src/endpoints/nodes/entities/node.status";

export class AccountKeyFilter {
  constructor(init?: Partial<AccountKeyFilter>) {
    Object.assign(this, init);
  }

  status: NodeStatusRaw[] = [];
}
