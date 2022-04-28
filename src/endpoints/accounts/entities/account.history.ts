import { ApiProperty } from "@nestjs/swagger";

export class AccountHistory {
    @ApiProperty({ type: String })
    address: string = '';

    @ApiProperty({ type: String, default: 0 })
    balance: string = '';

    @ApiProperty({ type: Number })
    timestamp: number = 0;

    @ApiProperty({ type: Boolean, nullable: true })
    isSender?: boolean | undefined = undefined;
}
