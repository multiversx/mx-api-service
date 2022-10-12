import { ApiProperty } from "@nestjs/swagger";
import { AccountHistory } from "./account.history";

export class AccountEsdtHistory extends AccountHistory {
  constructor(init?: Partial<AccountEsdtHistory>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: 'WEGLD-bd4d79' })
  token: string = '';
}
