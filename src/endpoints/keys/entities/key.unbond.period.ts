import { ApiProperty } from "@nestjs/swagger";

export class KeyUnbondPeriod {
  constructor(init?: Partial<KeyUnbondPeriod>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number, example: 10 })
  remainingUnBondPeriod: number = 0;
}
