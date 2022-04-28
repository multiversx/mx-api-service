import { ApiProperty } from "@nestjs/swagger";

export class KeyUnbondPeriod {
  @ApiProperty({ type: Number })
  remainingUnBondPeriod: number = 0;
}
