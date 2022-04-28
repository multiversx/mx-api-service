import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "./token.assets";

export class Token {
  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: String })
  ticker: string = '';

  @ApiProperty({ type: String })
  owner: string = '';

  @ApiProperty({ type: String })
  minted: string = '';

  @ApiProperty({ type: String })
  burnt: string = '';

  @ApiProperty({ type: String })
  initialMinted: string = '';

  @ApiProperty({ type: Number })
  decimals: number = 0;

  @ApiProperty({ type: Boolean, default: false })
  isPaused: boolean = false;

  @ApiProperty({ type: TokenAssets, nullable: true })
  assets: TokenAssets | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  transactions: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  accounts: number | undefined = undefined;
}
