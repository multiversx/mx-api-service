import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { AccountUndelegation } from "./account.undelegation";

@ObjectType("AccountDelegation", { description: "Account delegation object type that extends Account." })
export class AccountDelegation {
  constructor(init?: Partial<AccountDelegation>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Address for the given detailed account.' })
  @ApiProperty({ type: String })
  address: string = "";

  @Field(() => String, { description: 'Contract for the given detailed account.' })
  @ApiProperty({ type: String })
  contract: string = "";

  @Field(() => String, { description: 'UserUnBondable for the given detailed account.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  userUnBondable: string = "";

  @Field(() => String, { description: 'UserActiveStake for the given detailed account.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  userActiveStake: string = "";

  @Field(() => String, { description: 'Claimable Rewards for the given detailed account.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  claimableRewards: string = "";

  @Field(() => AccountUndelegation, { description: 'UserUndelegatedList for the given detailed account.' })
  @ApiProperty({ type: AccountUndelegation, isArray: true })
  userUndelegatedList: AccountUndelegation[] = [];
}
