import { ApiProperty } from "@nestjs/swagger";

export class Constants {
    @ApiProperty({ description: 'The chain identifier' })
    chainId: string = '';

    @ApiProperty({ description: 'Gas per data byte' })
    gasPerDataByte: number = 0;

    @ApiProperty({ description: 'Minimum gas limit' })
    minGasLimit: number = 0;

    @ApiProperty({ description: 'Minimum gas price' })
    minGasPrice: number = 0;

    @ApiProperty({ description: 'Minimum transaction version' })
    minTransactionVersion: number = 0;
}