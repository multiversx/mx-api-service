import { BadRequestException } from "@nestjs/common";

export enum UsersCountRange {
  _24h = '24h',
  _7d = '7d',
  _30d = '30d'
}

export type FeesRange = UsersCountRange;
export const FeesRange = UsersCountRange;

export class ApplicationFilter {
  constructor(init?: Partial<ApplicationFilter>) {
    Object.assign(this, init);
  }

  after?: number;
  before?: number;
  withTxCount?: boolean;
  isVerified?: boolean;
  addresses?: string[];
  usersCountRange?: UsersCountRange = UsersCountRange._24h;
  feesRange?: FeesRange = FeesRange._24h;

  validate(size: number) {
    if (this.withTxCount && size > 25) {
      throw new BadRequestException('Size must be less than or equal to 25 when withTxCount is set');
    }
  }

  isSet(): boolean {
    return this.after !== undefined ||
      this.before !== undefined ||
      this.withTxCount !== undefined ||
      this.isVerified !== undefined ||
      this.usersCountRange !== undefined ||
      this.feesRange !== undefined ||
      this.addresses !== undefined;
  }
}
