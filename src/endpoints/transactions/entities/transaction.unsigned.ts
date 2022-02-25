import { ApiProperty } from "@nestjs/swagger";

export class UnsignedTransaction {
    @ApiProperty()
    chainId: string = '';

    @ApiProperty()
    data: string = '';

    @ApiProperty()
    gasLimit: number = 0;

    @ApiProperty()
    gasPrice: number = 0;

    @ApiProperty()
    nonce: number = 0;

    @ApiProperty()
    receiver: string = '';

    @ApiProperty()
    sender: string = '';

    @ApiProperty()
    value: string = '';

    @ApiProperty()
    version: number = 0;
}
