import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { AccountUndelegation } from "./account.undelegation";

export class AccountDelegation {
  constructor(init?: Partial<AccountDelegation>) {
    Object.assign(this, init);
  }

  @ApiProperty({ name: 'Delegation account details', type: String })
  address: string = "";

  @ApiProperty({ name: 'Account delegation contract', type: String })
  contract: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  userUnBondable: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  userActiveStake: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  claimableRewards: string = "";

  @ApiProperty({ name: 'User undelegated list details', type: AccountUndelegation, isArray: true })
  userUndelegatedList: AccountUndelegation[] = [];
}
