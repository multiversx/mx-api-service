import { ApiProperty } from "@nestjs/swagger";

export class AccountDelegationLegacy {
  @ApiProperty()
  claimableRewards: string = '';

  @ApiProperty()
  userActiveStake: string = '';

  @ApiProperty()
  userDeferredPaymentStake: string = '';

  @ApiProperty()
  userUnstakedStake: string = '';

  @ApiProperty()
  userWaitingStake: string = '';

  @ApiProperty()
  userWithdrawOnlyStake: string = '';
}
