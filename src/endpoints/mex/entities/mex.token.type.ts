import { ApiProperty } from '@nestjs/swagger';
import { MexPairType } from './mex.pair.type';

export class MexTokenType {
  constructor(init?: Partial<MexTokenType>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: '' })
  identifier: string = '';

  @ApiProperty({ enum: MexPairType })
  type: MexPairType = MexPairType.experimental;
}
