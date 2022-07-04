import { KeybaseIdentity } from "src/common/keybase/entities/keybase.identity";
import { Node } from "src/endpoints/nodes/entities/node";

export class IdentityDetailed extends KeybaseIdentity {
  constructor(init?: Partial<IdentityDetailed>) {
    super();
    Object.assign(this, init);
  }

  nodes?: Node[];
}
