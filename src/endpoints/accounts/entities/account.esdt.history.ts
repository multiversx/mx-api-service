import { ApiProperty } from "@nestjs/swagger";
import { AccountHistory } from "./account.history";

export class AccountEsdtHistory extends AccountHistory {
    @ApiProperty({ type: String, example: 'WEGLD-bd4d79' })
    token: string = '';
}
