import { registerEnumType } from "@nestjs/graphql";

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

registerEnumType(TokenType, {
  name: 'TokenType',
  description: 'Token Type object.',
  valuesMap: {
    FungibleESDT: {
      description: 'FungibleESDT.',
    },
    NonFungibleESDT: {
      description: 'NonFungibleESDT.',
    },
    SemiFungibleESDT: {
      description: 'SemiFungibleESDT.',
    },
    MetaESDT: {
      description: 'MetaESDT.',
    },
  },
});
