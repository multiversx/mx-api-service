import { SwaggerUtils } from '@elrondnetwork/nestjs-microservice-template';
import { ApiProperty } from '@nestjs/swagger';
export class AccountDeferred {
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Deferred payment amount' }))
  deferredPayment: string = '';

  @ApiProperty({ description: 'Seconds left until unbonding time' })
  secondsLeft: number = 0;
}
