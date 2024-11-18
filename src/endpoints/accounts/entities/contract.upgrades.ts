import { ApiProperty } from "@nestjs/swagger";
export class ContractUpgrades {
  constructor(init?: Partial<ContractUpgrades>) {
    Object.assign(this, init);
  }
  @ApiProperty({ type: String, nullable: true, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @ApiProperty({ type: String, nullable: true, example: '1c8c6b2148f25621fa2c798a2c9a184df61fdd1991aa0af7ea01eb7b89025d2a' })
  txHash: string = '';

  @ApiProperty({ type: String, nullable: true, example: '1c8c6b2148f25621fa2c798a2c9a184df61fdd1991aa0af7ea01eb7b89025d2a' })
  codeHash: string = '';

  @ApiProperty({ type: Number, nullable: true, example: '1638577452' })
  timestamp: number = 0;
}
