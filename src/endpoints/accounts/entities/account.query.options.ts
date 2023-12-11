import { BadRequestException } from "@nestjs/common";

export class AccountQueryOptions {
  private static readonly ADDRESS_MAX_SIZE: number = 50;

  address?: string[];

  constructor(init?: Partial<AccountQueryOptions>) {
    Object.assign(this, init);
  }

  validateAddressArraySize(): void {
    if (this.address && this.address.length > AccountQueryOptions.ADDRESS_MAX_SIZE) {
      throw new BadRequestException(`Maximum of ${AccountQueryOptions.ADDRESS_MAX_SIZE} addresses allowed`);
    }
  }
}
