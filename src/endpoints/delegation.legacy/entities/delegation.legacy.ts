import { SwaggerUtils } from '@elrondnetwork/erdnest-common';
import { ApiProperty } from '@nestjs/swagger';
export class DelegationLegacy {

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalWithdrawOnlyStake: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalWaitingStake: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalActiveStake: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalUnstakedStake: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalDeferredPaymentStake: string = '';

  @ApiProperty()
  numUsers: number = 0;
}
