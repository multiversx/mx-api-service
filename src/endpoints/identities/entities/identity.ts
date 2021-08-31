import { ApiProperty } from "@nestjs/swagger";

export class Identity {
  @ApiProperty()
  avatar: string = '';

  @ApiProperty()
  description: string = '';

  @ApiProperty()
  distribution: { [ index: string ]: number } = {};

  @ApiProperty()
  identity: string = '';

  @ApiProperty()
  locked: string = '';

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  rank: number = 0;

  @ApiProperty()
  score: string = '';

  @ApiProperty()
  stake: string = '';

  @ApiProperty()
  stakePercent: number = 0;

  @ApiProperty()
  topUp: string = '';

  @ApiProperty()
  validators: number = 0;
}