
export class TokenData {
  constructor(init?: Partial<TokenData>) {
    Object.assign(this, init);
  }

  balance: string = '0';
  properties: string = '';
  tokenIdentifier: string = '';
}
