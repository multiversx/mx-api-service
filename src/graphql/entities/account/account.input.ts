import { Field, InputType, Float } from "@nestjs/graphql";
import { AccountFilter } from "src/endpoints/accounts/entities/account.filter";

@InputType({ description: "Input to retrieve the given accounts for." })
export class GetAccountFilteredInput {
  constructor(partial?: Partial<GetAccountFilteredInput>) {
    Object.assign(this, partial);
  }

  @Field(() => String, { name: "ownerAddress", description: "Owner address to retrieve for the given result set.", nullable: true })
  ownerAddress: string | undefined = undefined;
  public static resolve(input: GetAccountFilteredInput): AccountFilter {
    return new AccountFilter({
      ownerAddress: input.ownerAddress,
    });

  }
}


@InputType({ description: "Input to retrieve the given accounts for." })
export class GetAccountsInput extends GetAccountFilteredInput {
  constructor(partial?: Partial<GetAccountsInput>) {
    super();
    Object.assign(this, partial);
  }

  @Field(() => Float, { name: "from", description: "Number of accounts to skip for the given result set.", nullable: true, defaultValue: 0 })
  from: number = 0;

  @Field(() => Float, { name: "size", description: "Number of accounts to retrieve for the given result set.", nullable: true, defaultValue: 25 })
  size: number = 25;
}
