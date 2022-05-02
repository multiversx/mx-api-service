import { ApiProperty } from '@nestjs/swagger';
import { SwaggerUtils } from 'src/utils/swagger.utils';
export class AccountDeferred {
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Deferred payment amount' }))
  deferredPayment: string = '';

  @ApiProperty({ description: 'Seconds left until unbonding time' })
  secondsLeft: number = 0;
}
