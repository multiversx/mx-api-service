import { ApiProperty } from '@nestjs/swagger';
import { SwaggerUtils } from 'src/utils/swagger.utils';

export class DelegationLegacy {
  constructor(init?: Partial<DelegationLegacy>) {
    Object.assign(this, init);
  }

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
