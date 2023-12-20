import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

@ObjectType("TransactionInPool", { description: "Transaction in pool object type." })
export class TransactionInPool {
  constructor(init?: Partial<TransactionInPool>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Transaction hash." })
  @ApiProperty({ type: String, example: "" })
  txHash: string = '';

  @Field(() => String, { description: "Sender address." })
  @ApiProperty({ type: String, example: "" })
  sender: string = '';

  @Field(() => String, { description: "Receiver address." })
  @ApiProperty({ type: String, example: "" })
  receiver: string = '';

  @Field(() => String, { description: "Receiver username." })
  @ApiProperty({ type: String, example: "" })
  receiverUsername: string = '';

  @Field(() => Number, { description: "Transaction nonce." })
  @ApiProperty({ type: Number, example: 0 })
  nonce: number = 0;

  @Field(() => String, { description: "Transaction value." })
  @ApiProperty({ type: String, example: "" })
  value: string = '';

  @Field(() => String, { description: "Transaction data." })
  @ApiProperty({ type: String, example: "" })
  data: string = '';

  @Field(() => Number, { description: "Gas price for the transaction." })
  @ApiProperty({ type: Number, example: 0 })
  gasPrice: number = 0;

  @Field(() => Number, { description: "Gas limit for the transaction." })
  @ApiProperty({ type: Number, example: 0 })
  gasLimit: number = 0;

  @Field(() => TransactionType, { description: "The type of the transaction." })
  @ApiProperty({ type: String, example: "SmartContractResult" })
  type: TransactionType = TransactionType.Transaction;
}
