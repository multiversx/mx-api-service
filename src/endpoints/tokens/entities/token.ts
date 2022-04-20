import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "./token.assets";

export class Token {
  @ApiProperty()
  identifier: string = '';

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  ticker: string = '';

  @ApiProperty()
  owner: string = '';

  @ApiProperty()
  minted: string = '';

  @ApiProperty()
  burnt: string = '';

  @ApiProperty()
  decimals: number = 0;

  @ApiProperty()
  isPaused: boolean = false;

  @ApiProperty({ type: TokenAssets })
  assets: TokenAssets | undefined = undefined;

  @ApiProperty({ type: Number })
  transactions: number | undefined = undefined;

  @ApiProperty({ type: Number })
  accounts: number | undefined = undefined;
}
