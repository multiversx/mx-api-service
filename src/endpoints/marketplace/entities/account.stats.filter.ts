import { ApiProperty } from "@nestjs/swagger";

export class AccountStatsFilters {
  constructor(init?: Partial<AccountStatsFilters>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  address: string = '';

  @ApiProperty({ type: String })
  marketplaceKey?: string = '';

  @ApiProperty({ type: Boolean })
  isOwner?: boolean = false;
}
