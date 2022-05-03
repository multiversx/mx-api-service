import { ApiProperty } from "@nestjs/swagger";

export class KeyUnbondPeriod {
  @ApiProperty({ type: Number, example: 10 })
  remainingUnBondPeriod: number = 0;
}
