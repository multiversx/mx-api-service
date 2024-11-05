import { ApiProperty } from "@nestjs/swagger";

export class TransactionPool {
  constructor(init?: Partial<TransactionPool>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, description: 'Transaction hash', example: '39098e005c9f53622e9c8a946f9141d7c29a5da3bc38e07e056b549fa017ae1b' })
  txHash?: string;

  @ApiProperty({ type: String, description: 'Sender bech32 address', example: 'erd1wh9c0sjr2xn8hzf02lwwcr4jk2s84tat9ud2kaq6zr7xzpvl9l5q8awmex' })
  sender?: string;

  @ApiProperty({ type: String, description: 'Receiver bech32 address', example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  receiver?: string;

  @ApiProperty({ type: Number, description: 'Transaction value', example: 1000000000000000000 })
  value?: number;

  @ApiProperty({ type: Number, description: 'Nonce details', example: 100 })
  nonce?: number;

  @ApiProperty({ type: String, description: 'Transaction data', example: 'TEST==', required: false })
  data?: string;

  @ApiProperty({ type: Number, description: 'Transaction gas price', example: 1000000000 })
  gasPrice?: number;

  @ApiProperty({ type: Number, description: 'Transaction gas limit', example: 50000 })
  gasLimit?: number;
}
