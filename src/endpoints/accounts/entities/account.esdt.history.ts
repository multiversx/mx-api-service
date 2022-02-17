import {ApiProperty} from "@nestjs/swagger";
import {AccountHistory} from "./account.history";

export class AccountEsdtHistory extends AccountHistory {
    @ApiProperty({description: 'The current balance of the token (must be denominated to obtain the real value)'})
    token: string = '';
}
