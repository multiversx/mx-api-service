import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { ApiProperty } from "@nestjs/swagger";
import { AccountUndelegation } from "./account.undelegation";

export class AccountDelegation {
  constructor(init?: Partial<AccountDelegation>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  address: string = "";

  @ApiProperty({ type: String })
  contract: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  userUnBondable: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  userActiveStake: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  claimableRewards: string = "";

  @ApiProperty({ type: AccountUndelegation, isArray: true })
  userUndelegatedList: AccountUndelegation[] = [];
}
