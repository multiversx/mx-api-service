import { ApiProperty } from "@nestjs/swagger";
import { AccountHistory } from "./account.history";

export class AccountEsdtHistory extends AccountHistory {
    @ApiProperty({ type: String })
    token: string = '';
}
