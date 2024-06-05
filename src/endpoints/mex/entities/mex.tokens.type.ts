import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { MexPairType } from './mex.pair.type';

@ObjectType("MexTokenType", { description: "MexTokenType object type." })
export class MexTokenType {
  constructor(init?: Partial<MexTokenType>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Mex token identifier" })
  @ApiProperty({ type: String, example: '' })
  identifier: string = '';

  @Field(() => MexPairType, { description: "Mex token type details." })
  @ApiProperty({ enum: MexPairType })
  type: MexPairType = MexPairType.experimental;
}
