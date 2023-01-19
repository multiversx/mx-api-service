export class NftData {
  constructor(init?: Partial<NftData>) {
    Object.assign(this, init);
  }

  balance: string = '0';
  attributes: string = '';
  creator: string = '';
  name: string = '';
  nonce: number = 0;
  royalties: string = '';
  uris: string[] = [];
  tokenIdentifier: string = '';
}
