import { BadRequestException } from "@nestjs/common";

export class ProviderQueryOptions {
  constructor(init?: Partial<ProviderQueryOptions>) {
    Object.assign(this, init);
  }

  withLatestInfo?: boolean = false;
  withIdentityInfo?: boolean = false;

  static applyDefaultOptions(owner: string | undefined, options: ProviderQueryOptions): ProviderQueryOptions {
    if (options.withLatestInfo === true && !owner) {
      throw new BadRequestException(`'withLatestInfo' can only be activated when an 'owner' filter is also applied.`);
    }

    return options;
  }
}
