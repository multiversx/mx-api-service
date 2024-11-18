import { ApiProperty } from "@nestjs/swagger";

export class ProviderAccounts {
  constructor(init?: Partial<ProviderAccounts>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, nullable: true, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @ApiProperty({ type: String, nullable: true, example: '9999109666430000000' })
  stake: string = '';
}
