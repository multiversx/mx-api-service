import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("MexStakingProxy", { description: "MexStakingProxy object type." })
export class MexStakingProxy {
  constructor(init?: Partial<MexStakingProxy>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Address details." })
  @ApiProperty({ type: String, example: 'erd1qqqqqqqqqqqqqpgq2ymdr66nk5hx32j2tqdeqv9ajm9dj9uu2jps3dtv6v' })
  address: string = '';

  @Field(() => String, { description: "Dual Yield token name." })
  @ApiProperty()
  dualYieldTokenName: string = '';

  @Field(() => String, { description: "Dual Yield token collection." })
  @ApiProperty()
  dualYieldTokenCollection: string = '';

  static fromQueryResponse(response: any): MexStakingProxy {
    const stakingProxy = new MexStakingProxy();
    stakingProxy.address = response.address;
    stakingProxy.dualYieldTokenName = response.dualYieldToken.name;
    stakingProxy.dualYieldTokenCollection = response.dualYieldToken.collection;

    return stakingProxy;
  }
}
