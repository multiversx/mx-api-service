import { ApiProperty } from "@nestjs/swagger";

export class AccountHistory {
    @ApiProperty({ description: 'The address of the account' })
    address: string = '';

    @ApiProperty({ description: 'The current balance of the account (must be denominated to obtain the real value)' })
    balance: string = '';

    @ApiProperty({ description: 'The timestamp of snapshot for account balance' })
    timestamp: number = 0;

    @ApiProperty({ description: 'Is the account sender of transaction', type: Boolean, nullable: true })
    isSender?: boolean | undefined = undefined;
}
