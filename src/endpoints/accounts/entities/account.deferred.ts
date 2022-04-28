import { ApiProperty } from '@nestjs/swagger';
export class AccountDeferred {
  @ApiProperty({type: String, default: 0})
  deferredPayment: string = '';

  @ApiProperty({type: Number})
  secondsLeft: number = 0;
}
