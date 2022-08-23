import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { SmartContractResult } from '../../sc-results/entities/smart.contract.result';
import { Transaction } from './transaction';
import { TransactionReceipt } from './transaction.receipt';
import { TransactionLog } from './transaction.log';
import { TransactionOperation } from './transaction.operation';
import { ComplexityEstimation } from '@elrondnetwork/erdnest';

@ObjectType(TransactionDetailed.name, { description: 'Detailed Transaction object type that extends Transaction.' })
export class TransactionDetailed extends Transaction {
  constructor(init?: Partial<TransactionDetailed>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => [SmartContractResult], { description: 'Smart contract results list for the given detailed transaction. Complexity: 200', nullable: true })
  @ApiProperty({ type: SmartContractResult, isArray: true })
  @ComplexityEstimation({ group: "details", value: 200, alternatives: ["withScResults"] })
  results: SmartContractResult[] | undefined = undefined;

  @Field(() => TransactionReceipt, { description: 'Transaction receipt for the given detailed transaction.', nullable: true })
  @ApiProperty({ type: TransactionReceipt, nullable: true })
  receipt: TransactionReceipt | undefined = undefined;

  @Field(() => Float, { description: 'Price for the given detailed transaction.', nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  price: number | undefined = undefined;

  @Field(() => TransactionLog, { description: 'Transaction log for the given detailed transaction.', nullable: true })
  @ApiProperty({ type: TransactionLog, nullable: true })
  logs: TransactionLog | undefined = undefined;

  @Field(() => [TransactionOperation], { description: 'Transaction operations list for the given detailed transaction. Complexity: 200', nullable: true })
  @ApiProperty({ type: TransactionOperation, isArray: true })
  @ComplexityEstimation({ group: "details", value: 200, alternatives: ["withOperations"] })
  operations: TransactionOperation[] = [];
}

