import { ApiProperty } from "@nestjs/swagger";
import { TokenAssetStatus } from "./token.asset.status";

export class TokenAssets {
  @ApiProperty({ type: String })
  website: string = '';

  @ApiProperty({ type: String })
  description: string = '';

  @ApiProperty({ enum: TokenAssetStatus, default: 'inactive' })
  status: TokenAssetStatus = TokenAssetStatus.inactive;

  @ApiProperty({ type: String })
  pngUrl: string = '';

  @ApiProperty({ type: String })
  svgUrl: string = '';

  @ApiProperty({ type: String, isArray: true })
  lockedAccounts: string[] | Record<string, string> | undefined = undefined;

  @ApiProperty()
  extraTokens: string[] | undefined = undefined;
}
