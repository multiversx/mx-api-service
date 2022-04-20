import { ApiProperty } from '@nestjs/swagger';
export class AccountDeferred {
  @ApiProperty()
  deferredPayment: string = '';

  @ApiProperty()
  secondsLeft: number = 0;
}
