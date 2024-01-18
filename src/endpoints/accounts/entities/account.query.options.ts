import { SortOrder } from "src/common/entities/sort.order";
import { AccountSort } from "./account.sort";
import { BadRequestException } from "@nestjs/common";

export class AccountFilter {
  constructor(init?: Partial<AccountFilter>) {
    Object.assign(this, init);
  }

  ownerAddress?: string;

  sort?: AccountSort;
  order?: SortOrder;
  isSmartContract?: boolean;
  withOwnerAssets?: boolean;
  withDeployInfo?: boolean;

  validate(size: number) {
    if (this.withDeployInfo && size > 25) {
      throw new BadRequestException('Size must be less than or equal to 25 when withDeployInfo is set');
    }
  }

  isSet(): boolean {
    return this.ownerAddress !== undefined ||
      this.sort !== undefined ||
      this.order !== undefined ||
      this.isSmartContract !== undefined ||
      this.withOwnerAssets !== undefined ||
      this.withDeployInfo !== undefined;
  }
}
