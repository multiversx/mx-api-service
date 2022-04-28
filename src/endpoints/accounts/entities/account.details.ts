import { ApiProperty } from '@nestjs/swagger';
export class AccountDetails {
    @ApiProperty({ type: String })
    address: string = '';

    @ApiProperty({ type: Number })
    nonce: number = 0;

    @ApiProperty({ type: String })
    balance: string = '';

    @ApiProperty({ type: String })
    rootHash: string = '';

    @ApiProperty({ type: Number })
    txCount: number = 0;

    @ApiProperty({ type: Number })
    scrCount: number = 0;

    @ApiProperty({ type: Number })
    shard: number = 0;

    @ApiProperty({ type: String, default: 0 })
    developerReward: string = '0';
}
