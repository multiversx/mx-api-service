
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
@ObjectType("ContractUpgrades", { description: "ContractUpgrades object type." })
export class ContractUpgrades {
  constructor(init?: Partial<ContractUpgrades>) {
    Object.assign(this, init);
  }
  @Field(() => String, { description: 'Address details.' })
  @ApiProperty({ type: String, nullable: true, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @Field(() => String, { description: 'TxHash details.' })
  @ApiProperty({ type: String, nullable: true, example: '1c8c6b2148f25621fa2c798a2c9a184df61fdd1991aa0af7ea01eb7b89025d2a' })
  txHash: string = '';

  @Field(() => Float, { description: 'Timestamp details.' })
  @ApiProperty({ type: Number, nullable: true, example: '1638577452' })
  timestamp: number = 0;
}
