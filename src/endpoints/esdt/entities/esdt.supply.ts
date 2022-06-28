import { EsdtLockedAccount } from "./esdt.locked.account";
import { SwaggerUtils } from 'src/utils/swagger.utils';
import { ApiProperty } from "@nestjs/swagger";

export class EsdtSupply {
  constructor(init?: Partial<EsdtSupply>) {
    Object.assign(this, init);
  }

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
