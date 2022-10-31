import { registerEnumType } from '@nestjs/graphql';

export enum TokenType {
  FungibleESDT = 'FungibleESDT',
  NonFungibleESDT = 'NonFungibleESDT',
  SemiFungibleESDT = 'SemiFungibleESDT',
  MetaESDT = 'MetaESDT',
}

registerEnumType(TokenType, {
  name: 'TokenType',
  description: 'Token type object type.',
  valuesMap: {
    FungibleESDT: {
      description: 'Fungible ESDT token type.',
    },
    NonFungibleESDT: {
      description: 'Non-fungible ESDT token type.',
    },
    SemiFungibleESDT: {
      description: 'Semi-fungible ESDT token type.',
    },
    MetaESDT: {
      description: 'Meta ESDT token type.',
    },
  },
});
