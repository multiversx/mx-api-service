import { ApiProperty } from "@nestjs/swagger";

export class Identity {
  @ApiProperty({ type: String })
  identity?: string = '';

  @ApiProperty({ type: String })
  name?: string;

  @ApiProperty({ type: String })
  description?: string;

  @ApiProperty({ type: String })
  avatar?: string;

  @ApiProperty({ type: String })
  website?: string;

  @ApiProperty({ type: String })
  twitter?: string;

  @ApiProperty({ type: String })
  location?: string;

  @ApiProperty({ type: Number })
  score?: number;

  @ApiProperty({ type: Number })
  validators?: number;

  @ApiProperty({ type: String, default: 0 })
  stake?: string;

  @ApiProperty({ type: String, default: 0 })
  topUp?: string;

  @ApiProperty({ type: String, default: 0 })
  locked: string = '';

  @ApiProperty()
  distribution?: { [index: string]: number } = {};

  @ApiProperty({ type: [String] })
  providers?: string[];

  @ApiProperty({ type: Number })
  stakePercent?: number;

  @ApiProperty({ type: Number })
  rank?: number;

  @ApiProperty({ type: Number })
  apr?: number;
}
