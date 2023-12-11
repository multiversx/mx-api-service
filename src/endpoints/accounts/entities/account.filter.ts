import { SortOrder } from "src/common/entities/sort.order";
import { AccountSort } from "./account.sort";

export class AccountFilter {
  constructor(init?: Partial<AccountFilter>) {
    Object.assign(this, init);
  }
  ownerAddress?: string;

  sort?: AccountSort;
  order?: SortOrder;
  isSmartContract?: boolean;
  address?: string[];
}
