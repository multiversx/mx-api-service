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
  withOwnerAssets?: boolean;
  withDetails?: boolean;

  isSet(): boolean {
    return this.ownerAddress !== undefined ||
      this.sort !== undefined ||
      this.order !== undefined ||
      this.isSmartContract !== undefined ||
      this.withOwnerAssets !== undefined ||
      this.withDetails !== undefined;
  }
}
