import { BadRequestException } from "@nestjs/common";

export class ApplicationFilter {
  constructor(init?: Partial<ApplicationFilter>) {
    Object.assign(this, init);
  }

  after?: number;
  before?: number;
  withTxCount?: boolean;

  validate(size: number) {
    if (this.withTxCount && size > 25) {
      throw new BadRequestException('Size must be less than or equal to 25 when withTxCount is set');
    }
  }

  isSet(): boolean {
    return this.after !== undefined ||
      this.before !== undefined ||
      this.withTxCount !== undefined;
  }
}
