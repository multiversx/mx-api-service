import { ApiProperty } from "@nestjs/swagger";
import { TransactionLog } from "../../transactions/entities/transaction.log";

export class SmartContractResult {
    @ApiProperty()
    hash: string = '';

    @ApiProperty()
    timestamp: number = 0;

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

    @ApiProperty({ type: String, nullable: true })
    miniBlockHash: string | undefined = undefined;

    @ApiProperty({ type: TransactionLog, nullable: true })
    logs: TransactionLog | undefined = undefined;

    @ApiProperty({ type: String, nullable: true })
    returnMessage: string | undefined = undefined;
}
