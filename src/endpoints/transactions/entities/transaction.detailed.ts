import { ApiProperty } from "@nestjs/swagger";
import { SmartContractResult } from "./smart.contract.result";
import { Transaction } from "./transaction";
import { TransactionReceipt } from "./transaction.receipt";
import { TransactionLog } from "./transaction.log";

export class TransactionDetailed extends Transaction {
    @ApiProperty({ type: SmartContractResult, isArray: true })
    scResults: SmartContractResult[] = [];

    @ApiProperty({ type: TransactionReceipt })
    receipt: TransactionReceipt | undefined = undefined;

    @ApiProperty()
    price: number | undefined = undefined;

    @ApiProperty({ type: Array<TransactionLog>() })
    logs: Array<TransactionLog> | undefined = [];
}

