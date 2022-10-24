import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { AccountHistory } from "./account.history";

@ObjectType("AccountEsdtHistory", { description: "Account Esdt History object type." })
export class AccountEsdtHistory extends AccountHistory {
  constructor(init?: Partial<AccountEsdtHistory>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Token for the given history account details.' })
  @ApiProperty({ type: String, example: 'WEGLD-bd4d79' })
  token: string = '';
}
