import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { TransactionAction } from "src/endpoints/transactions/transaction-action/entities/transaction.action";
import { TransactionLog } from "../../transactions/entities/transaction.log";

@ObjectType("SmartContractResult", { description: "Smart contract result object type." })
export class SmartContractResult {
  constructor(init?: Partial<SmartContractResult>) {
    Object.assign(this, init);
  }

  @Field(() => ID, { description: 'Hash for the given smart contract result.', nullable: true })
  @ApiProperty({ type: String })
  hash: string = '';

  @Field(() => Float, { description: 'Timestamp for the given smart contract result.' })
  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @Field(() => Float, { description: 'Nonce for the given smart contract result.' })
  @ApiProperty({ type: Number })
  nonce: number = 0;

  @Field(() => Float, { description: 'Gas limit for the given smart contract result.' })
  @ApiProperty({ type: Number })
  gasLimit: number = 0;

  @Field(() => Float, { description: 'Gas price for the given smart contract result.' })
  @ApiProperty({ type: Number })
  gasPrice: number = 0;

  @Field(() => String, { description: 'Value for the given smart contract result.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  value: string = '';

  @Field(() => String, { description: 'Sender address for the given smart contract result.' })
  @ApiProperty({ type: String })
  sender: string = '';

  @Field(() => String, { description: 'Receiver address for the given smart contract result.' })
  @ApiProperty({ type: String })
  receiver: string = '';

  @Field(() => String, { description: 'Relayed value for the given smart contract result.' })
  @ApiProperty({ type: String })
  relayedValue: string = '';

  @Field(() => String, { description: 'Data for the given smart contract result.' })
  @ApiProperty({ type: String })
  data: string = '';

  @Field(() => String, { description: 'Previous transaction hash for the given smart contract result.' })
  @ApiProperty({ type: String })
  prevTxHash: string = '';

  @Field(() => String, { description: 'Original transaction hash for the given smart contract result.' })
  @ApiProperty({ type: String })
  originalTxHash: string = '';

  @Field(() => String, { description: 'Call type for the given smart contract result.' })
  @ApiProperty({ type: String })
  callType: string = '';

  @Field(() => String, { description: 'Mini block hash for the given smart contract result.', nullable: true })
  @ApiProperty({ type: String, nullable: true })
  miniBlockHash: string | undefined = undefined;

  @Field(() => TransactionLog, { description: 'Transaction logs for the given smart contract result.', nullable: true })
  @ApiProperty({ type: TransactionLog, nullable: true })
  logs: TransactionLog | undefined = undefined;

  @Field(() => String, { description: 'Return message for the given smart contract result.', nullable: true })
  @ApiProperty({ type: String, nullable: true })
  returnMessage: string | undefined = undefined;

  @Field(() => TransactionAction, { description: 'Transaction action for the given smart contract result.', nullable: true })
  @ApiProperty({ type: TransactionAction, nullable: true })
  action: TransactionAction | undefined = undefined;
}
