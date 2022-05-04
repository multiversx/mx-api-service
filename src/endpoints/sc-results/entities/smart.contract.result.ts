import { ApiProperty } from "@nestjs/swagger";
import { SwaggerUtils } from "src/utils/swagger.utils";
import { TransactionLog } from "../../transactions/entities/transaction.log";

export class SmartContractResult {
    @ApiProperty({ type: String })
    hash: string = '';

    @ApiProperty({ type: Number })
    timestamp: number = 0;

    @ApiProperty({ type: Number })
    nonce: number = 0;

    @ApiProperty({ type: Number })
    gasLimit: number = 0;

    @ApiProperty({ type: Number })
    gasPrice: number = 0;

    @ApiProperty(SwaggerUtils.amountPropertyOptions())
    value: string = '';

    @ApiProperty({ type: String })
    sender: string = '';

    @ApiProperty({ type: String })
    receiver: string = '';

    @ApiProperty({ type: String })
    relayedValue: string = '';

    @ApiProperty({ type: String })
    data: string = '';

    @ApiProperty({ type: String })
    prevTxHash: string = '';

    @ApiProperty({ type: String })
    originalTxHash: string = '';

    @ApiProperty({ type: String })
    callType: string = '';

    @ApiProperty({ type: String, nullable: true })
    miniBlockHash: string | undefined = undefined;

    @ApiProperty({ type: TransactionLog, nullable: true })
    logs: TransactionLog | undefined = undefined;

    @ApiProperty({ type: String, nullable: true })
    returnMessage: string | undefined = undefined;
}
