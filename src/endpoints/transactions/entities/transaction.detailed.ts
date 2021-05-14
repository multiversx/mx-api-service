import { ApiProperty } from "@nestjs/swagger";
import { SmartContractResult } from "./smart.contract.result";
import { Transaction } from "./transaction";

export class TransactionDetailed extends Transaction {
    @ApiProperty()
    data: string = '';

    @ApiProperty({ type: SmartContractResult, isArray: true })
    scResults: SmartContractResult[] = []
}

