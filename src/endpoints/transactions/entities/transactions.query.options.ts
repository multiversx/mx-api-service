import { BadRequestException } from "@nestjs/common";

export class TransactionQueryOptions {
  private static readonly SCAM_INFO_MAX_SIZE: number = 50;
  private static readonly USERNAME_MAX_SIZE: number = 50;

  constructor(init?: Partial<TransactionQueryOptions>) {
    Object.assign(this, init);
  }

  withScResults?: boolean = false;
  withOperations?: boolean = true;
  withLogs?: boolean = true;
  withScResultLogs?: boolean = true;
  withScamInfo?: boolean;
  withUsername?: boolean;

  static applyDefaultOptions(size: number, options: TransactionQueryOptions): TransactionQueryOptions {
    if (size <= TransactionQueryOptions.SCAM_INFO_MAX_SIZE) {
      options.withScamInfo = true;
    }

    if (options.withUsername === true && size > TransactionQueryOptions.USERNAME_MAX_SIZE) {
      throw new BadRequestException(`'withUsername' flag can only be activated for a maximum size of ${TransactionQueryOptions.USERNAME_MAX_SIZE}`);
    }

    return options;
  }
}
