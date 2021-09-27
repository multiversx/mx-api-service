import { KeybaseIdentity } from "src/common/entities/keybase.identity";
import { Node } from "src/endpoints/nodes/entities/node";

export class IdentityDetailed extends KeybaseIdentity {
  nodes?: Node[];
}