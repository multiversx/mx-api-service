import { EsdtLockedAccount } from "./esdt.locked.account";
import { ApiProperty } from "@nestjs/swagger";
import { SwaggerUtils } from "@elrondnetwork/nestjs-microservice-common";

export class EsdtSupply {
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalSupply: string = '0';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  circulatingSupply: string = '0';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  minted: string = '0';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  burned: string = '0';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  initialMinted: string = '0';

  @ApiProperty()
  lockedAccounts: EsdtLockedAccount[] | undefined = undefined;
}
