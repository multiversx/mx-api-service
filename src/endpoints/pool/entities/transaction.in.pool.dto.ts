import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

export class TransactionInPool {
  constructor(init?: Partial<TransactionInPool>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: "6dc737fcb21e6f599c557f6001f78ae1f073241d1bd9b488b02f86c5131d477c" })
  txHash: string = '';

  @ApiProperty({ type: String, example: "erd17rc0pu8s7rc0pu8s7rc0pu8s7rc0pu8s7rc0pu8s7rc0pu8s7rcqqkhty3" })
  sender: string = '';

  @ApiProperty({ type: String, example: "erd1an4xpn58j7ymd58m2jznr32t0vmas75egrdfa8mta6fzvqn9tkxq4jvghn" })
  receiver: string = '';

  @ApiProperty({ type: String, example: "alice.elrond" })
  receiverUsername: string = '';

  @ApiProperty({ type: Number, example: 37 })
  nonce: number = 0;

  @ApiProperty({ type: String, example: "83499410000000000000000" })
  value: string = '';

  @ApiProperty({ type: String, example: "dGV4dA==" })
  data: string = '';

  @ApiProperty({ type: Number, example: 1000000000 })
  gasPrice: number = 0;

  @ApiProperty({ type: Number, example: 50000 })
  gasLimit: number = 0;

  @ApiProperty({ type: String, example: "SmartContractResult" })
  type: TransactionType = TransactionType.Transaction;
}
