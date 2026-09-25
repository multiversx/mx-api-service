import { registerEnumType } from "@nestjs/graphql";
import { ElasticSortable } from "./elastic.sortable";

export interface TokenAccount extends ElasticSortable {
  identifier: string;
  address: string;
  balance: string;
  balanceNum: number;
  token: string;
  timestamp: number;
  type: TokenType;
  data: any;
  nft_scamInfoType: string;
  nft_scamInfoDescription: string;
}

export enum TokenType {
  FungibleESDT = 'FungibleESDT',

  NonFungibleESDT = 'NonFungibleESDT',
  NonFungibleESDTv2 = 'NonFungibleESDTv2',
  DynamicNonFungibleESDT = 'DynamicNonFungibleESDT',

  SemiFungibleESDT = 'SemiFungibleESDT',
  DynamicSemiFungibleESDT = 'DynamicSemiFungibleESDT',

  MetaESDT = 'MetaESDT',
  DynamicMetaESDT = 'DynamicMetaESDT',
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
