import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("AccountDelegationLegacy", { description: "Account delegation legacy." })
export class AccountDelegationLegacy {
  constructor(init?: Partial<AccountDelegationLegacy>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Claimable rewards for the given detailed account.' })
  @ApiProperty({ type: String, default: 0 })
  claimableRewards: string = '';

  @Field(() => String, { description: 'User active stake for the given detailed account.' })
  @ApiProperty({ type: String, default: 0 })
  userActiveStake: string = '';

  @Field(() => String, { description: 'User deferred payment stake for the given detailed account.' })
  @ApiProperty({ type: String, default: 0 })
  userDeferredPaymentStake: string = '';

  @Field(() => String, { description: 'User unstaked stake for the given detailed account.' })
  @ApiProperty({ type: String, default: 0 })
  userUnstakedStake: string = '';

  @Field(() => String, { description: 'User waiting stake for the given detailed account.' })
  @ApiProperty({ type: String, default: 0 })
  userWaitingStake: string = '';

  @Field(() => String, { description: 'User withdraw only stake for the given detailed account.' })
  @ApiProperty({ type: String, default: 0 })
  userWithdrawOnlyStake: string = '';
}
