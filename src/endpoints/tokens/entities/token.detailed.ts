import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { TokenRoles } from "./token.roles";

export class TokenDetailed extends Token {
  constructor(init?: Partial<TokenDetailed>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Supply amount' }))
  supply: string | number | undefined = undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Circulating supply amount' }))
  circulatingSupply: string | number | undefined = undefined;

  @ApiProperty({ type: TokenRoles, nullable: true, isArray: true })
  roles: TokenRoles[] | undefined = undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Minted amount' }))
  minted: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Burnt amount' }))
  burnt: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Initial minted amount' }))
  initialMinted: string = '';

  @ApiProperty({ type: Boolean, nullable: true })
  canTransfer: boolean | undefined = undefined;
}
