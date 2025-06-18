import { SortOrder } from "src/common/entities/sort.order";
import { BadRequestException } from "@nestjs/common";
import { ApplicationSort } from "./application.sort";

export enum UsersCountRange {
  _24h = '24h',
  _7d = '7d',
  _30d = '30d',
  _allTime = 'allTime',
}

export class ApplicationFilter {
  constructor(init?: Partial<ApplicationFilter>) {
    Object.assign(this, init);
  }

  addresses?: string[];
  ownerAddress?: string;
  sort?: ApplicationSort;
  order?: SortOrder;
  search?: string;
  usersCountRange?: UsersCountRange;
  feesRange?: UsersCountRange;
  isVerified?: boolean;
  hasAssets?: boolean;

  validate() {
    if (this.addresses && this.addresses.length > 25) {
      throw new BadRequestException('Addresses array must contain 25 or fewer elements');
    }
  }

  isSet(): boolean {
    return this.addresses !== undefined ||
      this.ownerAddress !== undefined ||
      this.sort !== undefined ||
      this.order !== undefined ||
      this.search !== undefined ||
      this.usersCountRange !== undefined ||
      this.feesRange !== undefined ||
      this.isVerified !== undefined ||
      this.hasAssets !== undefined;
  }
} 
