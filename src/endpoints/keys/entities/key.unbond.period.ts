import { ApiProperty } from "@nestjs/swagger";

export class KeyUnbondPeriod {
  @ApiProperty()
  remainingUnBondPeriod: number = 0;
}
