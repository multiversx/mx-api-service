import { ApiProperty } from "@nestjs/swagger";

export class AccountDelegationLegacy {
  @ApiProperty({ type: String, default: 0 })
  claimableRewards: string = '';

  @ApiProperty({ type: String, default: 0 })
  userActiveStake: string = '';

  @ApiProperty({ type: String, default: 0 })
  userDeferredPaymentStake: string = '';

  @ApiProperty({ type: String, default: 0 })
  userUnstakedStake: string = '';

  @ApiProperty({ type: String, default: 0 })
  userWaitingStake: string = '';

  @ApiProperty({ type: String, default: 0 })
  userWithdrawOnlyStake: string = '';
}
