import { ApiProperty } from "@nestjs/swagger";
import { TokenAssetStatus } from "./token.asset.status";

export class TokenAssets {
  @ApiProperty()
  website: string = '';

  @ApiProperty()
  description: string = '';

  @ApiProperty()
  status: TokenAssetStatus = TokenAssetStatus.inactive;

  @ApiProperty()
  pngUrl: string = '';

  @ApiProperty()
  svgUrl: string = '';

  @ApiProperty()
  lockedAccounts: string[] = [];
}