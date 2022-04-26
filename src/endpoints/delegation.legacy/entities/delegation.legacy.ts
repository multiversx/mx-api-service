import { ApiProperty } from '@nestjs/swagger';
export class DelegationLegacy {
  @ApiProperty({ type: String })
  totalWithdrawOnlyStake: string = '';

  @ApiProperty({ type: String })
  totalWaitingStake: string = '';

  @ApiProperty({ type: String })
  totalActiveStake: string = '';

  @ApiProperty({ type: String })
  totalUnstakedStake: string = '';

  @ApiProperty({ type: String })
  totalDeferredPaymentStake: string = '';

  @ApiProperty({ type: String })
  numUsers: string = '';
}
