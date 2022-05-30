import { ApiProperty } from '@nestjs/swagger';
import { SmartContractResult } from '../../sc-results/entities/smart.contract.result';
import { Transaction } from './transaction';
import { TransactionReceipt } from './transaction.receipt';
import { TransactionLog } from './transaction.log';
import { TransactionOperation } from "./transaction.operation";

export class TransactionDetailed extends Transaction {
    @ApiProperty({ type: SmartContractResult, isArray: true })
    results: SmartContractResult[] = [];

    @ApiProperty({ type: TransactionReceipt, nullable: true })
    receipt: TransactionReceipt | undefined = undefined;

    @ApiProperty({ type: Number, nullable: true })
    price: number | undefined = undefined;

    @ApiProperty({ type: TransactionLog, nullable: true })
    logs: TransactionLog | undefined = undefined;

    @ApiProperty({ type: TransactionOperation, isArray: true })
    operations: TransactionOperation[] = [];
}

