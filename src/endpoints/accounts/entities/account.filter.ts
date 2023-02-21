import { SortOrder } from "src/common/entities/sort.order";

export class AccountFilter {
  constructor(init?: Partial<AccountFilter>) {
    Object.assign(this, init);
  }
  ownerAddress?: string;
  order?: SortOrder;
}
