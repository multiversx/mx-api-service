import { ApiProperty } from "@nestjs/swagger";
import { MexDay } from "./mex.day";

export class MexWeek {
  @ApiProperty({ type: MexDay })
  days: MexDay[] = [];

  @ApiProperty()
  mex: string = "0";
}
