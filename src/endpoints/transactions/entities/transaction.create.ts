import { ApiProperty } from '@nestjs/swagger';

export class TransactionCreate {
  constructor(init?: Partial<TransactionCreate>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  chainId: string = '';

  @ApiProperty()
  data: string = '';

  @ApiProperty()
  gasLimit: number = 0;

  @ApiProperty()
  gasPrice: number = 0;

  @ApiProperty()
  nonce: number = 0;

  @ApiProperty()
  receiver: string = '';

  @ApiProperty()
  receiverUsername: string | undefined = undefined;

  @ApiProperty()
  sender: string = '';

  @ApiProperty()
  senderUsername: string | undefined = undefined;

  @ApiProperty()
  signature: string = '';

  @ApiProperty()
  value: string = '';

  @ApiProperty()
  version: number = 0;

  @ApiProperty()
  options?: number = undefined;

  @ApiProperty()
  guardian?: string = undefined;

  @ApiProperty()
  guardianSignature?: string = undefined;

  @ApiProperty()
  relayer?: string = undefined;

  @ApiProperty()
  relayerSignature?: string = undefined;
}
