import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { AccountUndelegation } from "./account.undelegation";

export class AccountDelegation {
  constructor(init?: Partial<AccountDelegation>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'Delegation account details', type: String })
  address: string = "";

  @ApiProperty({ description: 'Account delegation contract', type: String })
  contract: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ required: false }))
  userUnBondable: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ required: false }))
  userActiveStake: string = "";

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ required: false }))
  claimableRewards: string = "";

  @ApiProperty({ description: 'User undelegated list details', type: AccountUndelegation, isArray: true, required: false })
  userUndelegatedList: AccountUndelegation[] = [];
}
