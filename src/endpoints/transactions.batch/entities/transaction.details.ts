export class TransactionDetails {
  chainID: string = '';
  data: string | undefined = undefined;
  gasLimit: number = 0;
  gasPrice: number = 0;
  nonce: number = 0;
  receiver: string = '';
  sender: string = '';
  signature: string = '';
  value: string = '';
  version: number = 0;
  options?: number;
}
