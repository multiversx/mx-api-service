import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("TransactionPool", { description: "TransactionPool object type." })
export class TransactionPool {
  constructor(init?: Partial<TransactionPool>) {
    Object.assign(this, init);
  }
  @Field(() => ID, { description: "Hash for the given transaction." })
  @ApiProperty({ type: String, description: 'Transaction hash', example: '39098e005c9f53622e9c8a946f9141d7c29a5da3bc38e07e056b549fa017ae1b' })
  txHash?: string;

  @Field(() => String, { description: "Sender account for the given transaction." })
  @ApiProperty({ type: String, description: 'Sender bech32 address', example: 'erd1wh9c0sjr2xn8hzf02lwwcr4jk2s84tat9ud2kaq6zr7xzpvl9l5q8awmex' })
  sender?: string;

  @Field(() => String, { description: "Receiver account for the given transaction." })
  @ApiProperty({ type: String, description: 'Receiver bech32 address', example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  receiver?: string;

  @Field(() => String, { description: "Value for the given transaction." })
  @ApiProperty({ type: Number, description: 'Transaction value', example: 1000000000000000000 })
  value?: number;

  @Field(() => Float, { description: "Nonce for the given transaction.", nullable: true })
  @ApiProperty({ type: Number, description: 'Nonce details', example: 100 })
  nonce?: number;

  @Field(() => String, { description: "Data for the given transaction.", nullable: true })
  @ApiProperty({ type: String, description: 'Transaction data', example: 'TEST==' })
  data?: string;

  @Field(() => Float, { description: "Gas price for the given transaction.", nullable: true })
  @ApiProperty({ type: Number, description: 'Transaction gas price', example: 1000000000 })
  gasPrice?: number;

  @Field(() => Float, { description: "Gas limit for the given transaction.", nullable: true })
  @ApiProperty({ type: Number, description: 'Transaction gas limit', example: 50000 })
  gasLimit?: number;
}
