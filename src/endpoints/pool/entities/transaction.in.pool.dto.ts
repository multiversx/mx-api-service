import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

@ObjectType("TransactionInPool", { description: "Transaction in pool object type." })
export class TransactionInPool {
  constructor(init?: Partial<TransactionInPool>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Transaction hash." })
  @ApiProperty({ type: String, example: "6dc737fcb21e6f599c557f6001f78ae1f073241d1bd9b488b02f86c5131d477c" })
  txHash: string = '';

  @Field(() => String, { description: "Sender address." })
  @ApiProperty({ type: String, example: "erd17rc0pu8s7rc0pu8s7rc0pu8s7rc0pu8s7rc0pu8s7rc0pu8s7rcqqkhty3" })
  sender: string = '';

  @Field(() => String, { description: "Receiver address." })
  @ApiProperty({ type: String, example: "erd1an4xpn58j7ymd58m2jznr32t0vmas75egrdfa8mta6fzvqn9tkxq4jvghn" })
  receiver: string = '';

  @Field(() => String, { description: "Receiver username." })
  @ApiProperty({ type: String, example: "alice.elrond" })
  receiverUsername: string = '';

  @Field(() => Number, { description: "Transaction nonce." })
  @ApiProperty({ type: Number, example: 37 })
  nonce: number = 0;

  @Field(() => String, { description: "Transaction value." })
  @ApiProperty({ type: String, example: "83499410000000000000000" })
  value: string = '';

  @Field(() => String, { description: "Transaction data." })
  @ApiProperty({ type: String, example: "dGV4dA==" })
  data: string = '';

  @Field(() => Number, { description: "Gas price for the transaction." })
  @ApiProperty({ type: Number, example: 1000000000 })
  gasPrice: number = 0;

  @Field(() => Number, { description: "Gas limit for the transaction." })
  @ApiProperty({ type: Number, example: 50000 })
  gasLimit: number = 0;

  @Field(() => TransactionType, { description: "The type of the transaction." })
  @ApiProperty({ type: String, example: "SmartContractResult" })
  type: TransactionType = TransactionType.Transaction;
}
