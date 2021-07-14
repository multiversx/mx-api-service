import { ApiProperty } from "@nestjs/swagger";
import { SmartContractResult } from "./smart.contract.result";
import { Transaction } from "./transaction";
import { TransactionReceipt } from "./transaction.receipt";

export class TransactionDetailed extends Transaction {
    @ApiProperty({ type: SmartContractResult, isArray: true })
    scResults: SmartContractResult[] = [];

    @ApiProperty({ type: TransactionReceipt })
    receipt: TransactionReceipt | undefined = undefined;

    @ApiProperty()
    price: number | undefined = undefined;
}

