import { Transaction } from "./transaction";

export interface Operation extends Transaction {
  canBeIgnored: boolean;
  type: string;
}
