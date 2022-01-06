import { ApiProperty } from "@nestjs/swagger";

export class Identity {
  @ApiProperty()
  identity?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  avatar?: string;

  @ApiProperty()
  website?: string;

  @ApiProperty()
  twitter?: string;

  @ApiProperty()
  location?: string;

  @ApiProperty()
  score?: number;

  @ApiProperty()
  validators?: number;

  @ApiProperty()
  stake?: string;

  @ApiProperty()
  topUp?: string;

  @ApiProperty()
  locked: string = '0';

  @ApiProperty()
  distribution?: { [index: string]: number } = {};

  @ApiProperty()
  providers?: string[];

  @ApiProperty()
  stakePercent?: number;

  @ApiProperty()
  rank?: number;

  @ApiProperty()
  apr?: number;
}