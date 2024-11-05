import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";

export class Identity {
  constructor(init?: Partial<Identity>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  identity?: string = '';

  @ApiProperty({ type: String })
  name?: string;

  @ApiProperty({ type: String })
  description?: string;

  @ApiProperty({ type: String, required: false })
  avatar?: string;

  @ApiProperty({ type: String, required: false })
  website?: string;

  @ApiProperty({ type: String, required: false })
  twitter?: string;

  @ApiProperty({ type: String })
  location?: string;

  @ApiProperty({ type: Number, required: false })
  score?: number;

  @ApiProperty({ type: Number })
  validators?: number;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  stake?: string;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  topUp?: string;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  locked: string = '';

  @ApiProperty()
  distribution?: { [index: string]: number | undefined } = {};

  @ApiProperty({ type: [String], required: false })
  providers?: string[];

  @ApiProperty({ type: Number, required: false })
  stakePercent?: number;

  @ApiProperty({ type: Number, required: false })
  rank?: number;

  @ApiProperty({ type: Number, required: false })
  apr?: number;
}
