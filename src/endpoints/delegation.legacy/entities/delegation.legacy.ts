import { ApiProperty } from '@nestjs/swagger';
export class DelegationLegacy {

  @ApiProperty({ type: String, default: 0 })
  totalWithdrawOnlyStake: string = '';

  @ApiProperty({ type: String, default: 0 })
  totalWaitingStake: string = '';

  @ApiProperty({ type: String, default: 0 })
  totalActiveStake: string = '';

  @ApiProperty({ type: String, default: 0 })
  totalUnstakedStake: string = '';

  @ApiProperty({ type: String, default: 0 })
  totalDeferredPaymentStake: string = '';

  @ApiProperty({ type: String, default: 0 })
  numUsers: string = '';
}
