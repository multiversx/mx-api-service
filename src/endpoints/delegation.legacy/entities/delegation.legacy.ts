import { ApiProperty } from '@nestjs/swagger';
import { SwaggerUtils } from 'src/utils/swagger.utils';
export class DelegationLegacy {

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
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
