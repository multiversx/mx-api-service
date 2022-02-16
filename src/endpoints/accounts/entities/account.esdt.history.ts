import { ApiProperty } from "@nestjs/swagger";

export class AccountEsdtHistory {
    @ApiProperty({ description: 'The address of the account' })
    address: string = '';

    @ApiProperty({ description: 'The current balance of the account (must be denominated to obtain the real value)' })
    balance: string = '';

    @ApiProperty({ description: 'The current balance of the token (must be denominated to obtain the real value)' })
    token: string = '';

    @ApiProperty({ description: 'The timestamp of snapshot for account balance' })
    timestamp: number = 0;

    @ApiProperty({ description: 'Is the account sender of transaction' })
    isSender?: boolean | undefined = undefined;
}
