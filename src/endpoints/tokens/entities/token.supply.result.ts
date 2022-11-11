import { Field, ObjectType } from "@nestjs/graphql";
import { EsdtLockedAccount } from "src/endpoints/esdt/entities/esdt.locked.account";

@ObjectType("TokenSupplyResult", { description: "TokenSupplyResult object type." })
export class TokenSupplyResult {
  constructor(init?: Partial<TokenSupplyResult>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Token supply." })
  supply: string | number = '';

  @Field(() => String, { description: "Token circulating supply." })
  circulatingSupply: string | number = '';

  @Field(() => String, { description: "Token minted details." })
  minted: string | number | undefined;

  @Field(() => String, { description: "Token burnt." })
  burnt: string | number | undefined;

  @Field(() => String, { description: "Token initial minted." })
  initialMinted: string | number | undefined;

  @Field(() => [EsdtLockedAccount], { description: "Token locked accounts." })
  lockedAccounts: EsdtLockedAccount[] | undefined = undefined;
}
