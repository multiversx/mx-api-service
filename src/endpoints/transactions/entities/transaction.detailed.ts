import { ApiProperty } from '@nestjs/swagger';
import { SmartContractResult } from '../../sc-results/entities/smart.contract.result';
import { Transaction } from './transaction';
import { TransactionReceipt } from './transaction.receipt';
import { TransactionLog } from './transaction.log';
import { TransactionOperation } from './transaction.operation';
import { ComplexityEstimation } from '@multiversx/sdk-nestjs-common';
export class TransactionDetailed extends Transaction {
  constructor(init?: Partial<TransactionDetailed>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ type: SmartContractResult, isArray: true })
  @ComplexityEstimation({ group: "details", value: 200, alternatives: ["withScResults"] })
  results: SmartContractResult[] | undefined = undefined;

  @ApiProperty({ type: TransactionReceipt, nullable: true })
  receipt: TransactionReceipt | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  price: number | undefined = undefined;

  @ApiProperty({ type: TransactionLog, nullable: true })
  @ComplexityEstimation({ group: "details", value: 200, alternatives: ["withLogs"] })
  logs: TransactionLog | undefined = undefined;

  @ApiProperty({ type: TransactionOperation, isArray: true })
  @ComplexityEstimation({ group: "details", value: 200, alternatives: ["withOperations"] })
  operations: TransactionOperation[] = [];

  @ApiProperty({ type: String, nullable: true })
  @ComplexityEstimation({ group: "blockInfo", value: 200, alternatives: ["withBlockInfo"] })
  senderBlockHash: string | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  @ComplexityEstimation({ group: "blockInfo", value: 200, alternatives: ["withBlockInfo"] })
  senderBlockNonce: number | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  @ComplexityEstimation({ group: "blockInfo", value: 200, alternatives: ["withBlockInfo"] })
  receiverBlockHash: string | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  @ComplexityEstimation({ group: "blockInfo", value: 200, alternatives: ["withBlockInfo"] })
  receiverBlockNonce: number | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  inTransit: boolean | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  relayedVersion: string | undefined = undefined;
}
