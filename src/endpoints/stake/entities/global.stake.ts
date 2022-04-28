import { ApiProperty } from "@nestjs/swagger";

export class GlobalStake {
  @ApiProperty({type: Number, default: 0})
  totalValidators: number = 0;

  @ApiProperty({type: Number, default: 0})
  activeValidators: number = 0;

  @ApiProperty({type: Number, default: 0})
  queueSize: number = 0;
}
