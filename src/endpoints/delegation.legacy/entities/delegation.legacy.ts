import { SwaggerUtils } from '@elrondnetwork/erdnest';
import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType("DelegationLegacy", { description: "DelegationLegacy object type." })
export class DelegationLegacy {
  constructor(init?: Partial<DelegationLegacy>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Total Withdraw Only Stake details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalWithdrawOnlyStake: string = '';

  @Field(() => String, { description: "Total Waiting Stake details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalWaitingStake: string = '';

  @Field(() => String, { description: "Total Active Stake details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalActiveStake: string = '';

  @Field(() => String, { description: "Total Unstake Stake details" })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalUnstakedStake: string = '';

  @Field(() => String, { description: "Total Deferred Payment Stake details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  totalDeferredPaymentStake: string = '';

  @Field(() => Float, { description: "Total number of users." })
  @ApiProperty()
  numUsers: number = 0;
}
