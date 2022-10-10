import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { Account } from "src/endpoints/accounts/entities/account";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { TransactionAction } from "../transaction-action/entities/transaction.action";

@ObjectType("Transaction", { description: "Transaction object type." })
export class Transaction {
  constructor(init?: Partial<Transaction>) {
    Object.assign(this, init);
  }

  @Field(() => ID, { description: "Hash for the given transaction." })
  @ApiProperty({ type: String })
  txHash: string = '';

  @Field(() => Float, { description: "Gas limit for the given transaction.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  gasLimit: number | undefined = undefined;

  @Field(() => Float, { description: "Gas price for the given transaction.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  gasPrice: number | undefined = undefined;

  @Field(() => Float, { description: "Gas used for the given transaction.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  gasUsed: number | undefined = undefined;

  @Field(() => String, { description: "Mini block hash for the given transaction.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  miniBlockHash: string | undefined = undefined;

  @Field(() => Float, { description: "Nonce for the given transaction.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  nonce: number | undefined = undefined;

  @Field(() => String, { name: "receiverAddress", description: "Receiver account for the given transaction." })
  @ApiProperty({ type: String })
  receiver: string = '';

  @Field(() => Account, { description: "Receiver account for the given transaction." })
  receiverAccount: Account | undefined = undefined;

  @Field(() => String, { name: "receiverHerotag", description: "Sender herotag for the given transaction." })
  @ApiProperty({ type: String })
  receiverHerotag: string = '';

  @ApiProperty({ type: AccountAssets, nullable: true })
  receiverAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: Number })
  receiverShard: number = 0;

  @Field(() => Float, { description: "Round for the given transaction.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  round: number | undefined = undefined;

  @Field(() => String, { name: "senderAddress", description: "Sender account for the given transaction." })
  @ApiProperty({ type: String })
  sender: string = '';

  @Field(() => Account, { description: "Sender account for the given transaction." })
  senderAccount: Account | undefined = undefined;

  @Field(() => String, { name: "senderHerotag", description: "Sender herotag for the given transaction." })
  @ApiProperty({ type: String })
  senderHerotag: string = '';

  @ApiProperty({ type: AccountAssets, nullable: true })
  senderAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: Number })
  senderShard: number = 0;

  @Field(() => String, { description: "Signature for the given transaction.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  signature: string | undefined = undefined;

  @Field(() => String, { description: "Status for the given transaction." })
  @ApiProperty({ type: String })
  status: string = '';

  @Field(() => String, { description: "Value for the given transaction." })
  @ApiProperty({ type: String })
  value: string = '';

  @Field(() => String, { description: "Fee for the given transaction.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  fee: string | undefined = undefined;

  @Field(() => Float, { description: "Timestamp for the given transaction." })
  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @Field(() => String, { description: "Data for the given transaction.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  data: string | undefined = undefined;

  @Field(() => String, { description: "Function for the given transaction.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  function: string | undefined = undefined;

  @Field(() => TransactionAction, { description: "Transaction action for the given transaction.", nullable: true })
  @ApiProperty({ type: TransactionAction, nullable: true })
  action: TransactionAction | undefined = undefined;

  @Field(() => ScamInfo, { description: "Scam information for the given transaction.", nullable: true })
  @ApiProperty({ type: ScamInfo, nullable: true })
  scamInfo: ScamInfo | undefined = undefined;

  @ApiProperty({ enum: TransactionType, nullable: true })
  type: TransactionType | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  originalTxHash: string | undefined = undefined;

  @Field(() => Boolean, { description: "Pending results for the given transaction.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  pendingResults: boolean | undefined = undefined;

  getDate(): Date | undefined {
    if (this.timestamp) {
      return new Date(this.timestamp * 1000);
    }

    return undefined;
  }
}
