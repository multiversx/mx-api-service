import { ApiProperty } from "@nestjs/swagger";

export class SmartContractResult {
    @ApiProperty()
    hash: string = '';

    @ApiProperty()
    nonce: number = 0;

    @ApiProperty()
    gasLimit: number = 0;

    @ApiProperty()
    gasPrice: number = 0;

    @ApiProperty()
    value: string = '';

    @ApiProperty()
    sender: string = '';

    @ApiProperty()
    receiver: string = '';

    @ApiProperty()
    relayedValue: string = '';

    @ApiProperty()
    data: string = '';

    @ApiProperty()
    prevTxHash: string = '';

    @ApiProperty()
    originalTxHash: string = '';

    @ApiProperty()
    callType: string = '';
}