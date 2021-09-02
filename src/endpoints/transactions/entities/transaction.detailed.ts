import { ApiProperty } from '@nestjs/swagger';
import { SmartContractResult } from './smart.contract.result';
import { Transaction } from './transaction';
import { TransactionReceipt } from './transaction.receipt';
import { TransactionLog } from './transaction.log';
import { TransactionScamInfo } from './transaction-scam-info';

export class TransactionDetailed extends Transaction {
    @ApiProperty({ type: SmartContractResult, isArray: true })
    results: SmartContractResult[] = [];

    @ApiProperty({ type: TransactionReceipt })
    receipt: TransactionReceipt | undefined = undefined;

    @ApiProperty()
    price: number | undefined = undefined;

    @ApiProperty({ type: TransactionLog })
    logs: TransactionLog | undefined = undefined;

    @ApiProperty({ type: TransactionScamInfo })
    scamInfo?: TransactionScamInfo | null;
}

