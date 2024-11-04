export class TokenOwnersHistory {
  constructor(init?: Partial<TokenOwnersHistory>) {
    Object.assign(this, init);
  }

  address: string = '';
  timestamp: number = 0;
}
