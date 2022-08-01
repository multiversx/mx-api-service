export interface TokenAccount {
  identifier: string;
  address: string;
  balance: string;
  balanceNum: number;
  token: string;
  timestamp: number;
  type: TokenType;
  data: any;
}

export enum TokenType {
  FungibleESDT = 'FungibleESDT',
  NonFungibleESDT = 'NonFungibleESDT',
  SemiFungibleESDT = 'SemiFungibleESDT',
  MetaESDT = 'MetaESDT',
}
