import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { ScamInfo } from "src/common/entities/scam-info.dto";
import { Account } from "src/endpoints/accounts/entities/account";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { TransactionAction } from "../transaction-action/entities/transaction.action";

export class Transaction {
  constructor(init?: Partial<Transaction>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  txHash: string = '';

  @ApiProperty({ type: Number, nullable: true })
  gasLimit: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  gasPrice: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  gasUsed: number | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  miniBlockHash: string | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  nonce: number | undefined = undefined;

  @ApiProperty({ type: String })
  receiver: string = '';

  @ApiProperty({ type: String })
  receiverUsername: string = '';

  receiverAccount: Account | undefined = undefined;

  @ApiProperty({ type: AccountAssets, nullable: true })
  receiverAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: Number })
  receiverShard: number = 0;

  @ApiProperty({ type: Number, nullable: true })
  round: number | undefined = undefined;

  @ApiProperty({ type: String })
  sender: string = '';

  @ApiProperty({ type: String })
  senderUsername: string = '';

  senderAccount: Account | undefined = undefined;

  @ApiProperty({ type: AccountAssets, nullable: true })
  senderAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: Number })
  senderShard: number = 0;

  @ApiProperty({ type: String, nullable: true })
  signature: string | undefined = undefined;

  @ApiProperty({ type: String })
  status: string = '';

  @ApiProperty({ type: String })
  value: string = '';

  @ApiProperty({ type: String, nullable: true })
  fee: string | undefined = undefined;

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: String, nullable: true })
  data: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  function: string | undefined = undefined;

  @ApiProperty({ type: TransactionAction, nullable: true })
  action: TransactionAction | undefined = undefined;

  @ApiProperty({ type: ScamInfo, nullable: true })
  scamInfo: ScamInfo | undefined = undefined;

  @ApiProperty({ enum: TransactionType, nullable: true })
  type: TransactionType | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  originalTxHash: string | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  pendingResults: boolean | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  guardianAddress: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  guardianSignature: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  isRelayed: boolean | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  relayer: string | undefined = undefined;

  getDate(): Date | undefined {
    if (this.timestamp) {
      return new Date(this.timestamp * 1000);
    }

    return undefined;
  }
}
