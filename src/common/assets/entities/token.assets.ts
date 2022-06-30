import { ApiProperty } from "@nestjs/swagger";
import { TokenAssetStatus } from "../../../endpoints/tokens/entities/token.asset.status";

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

  @ApiProperty({ type: String, isArray: true })
  extraTokens: string[] | undefined = undefined;
}
