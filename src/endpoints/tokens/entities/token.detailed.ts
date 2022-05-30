import { ApiProperty } from "@nestjs/swagger";
import { SwaggerUtils } from "src/utils/swagger.utils";
import { Token } from "./token";
import { TokenRoles } from "./token.roles";

export class TokenDetailed extends Token {
  @ApiProperty({ type: Boolean, default: false })
  canUpgrade: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canMint: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canBurn: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canChangeOwner: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canPause: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canFreeze: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canWipe: boolean = false;

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Supply amount' }))
  supply: string | undefined = undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Circulating supply amount' }))
  circulatingSupply: string | undefined = undefined;

  @ApiProperty({ type: TokenRoles, nullable: true })
  roles: TokenRoles[] | undefined = undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Minted amount' }))
  minted: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Burnt amount' }))
  burnt: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Initial minted amount' }))
  initialMinted: string = '';
}
