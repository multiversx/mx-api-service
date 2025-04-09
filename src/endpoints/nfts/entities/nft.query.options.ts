import { BadRequestException } from "@nestjs/common";

export class NftQueryOptions {
  constructor(init?: Partial<NftQueryOptions>) {
    Object.assign(this, init);
  }

  withOwner?: boolean;
  withSupply?: boolean;
  withReceivedAt?: boolean;

  validate(size: number): void {
    if (this.withReceivedAt && size > 25) {
      throw new BadRequestException('withReceivedAt can only be used with a size of 25');
    }
  }
}
