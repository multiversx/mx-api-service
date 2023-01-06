import { registerEnumType } from '@nestjs/graphql';

export enum TokenType {
  FungibleESDT = 'FungibleESDT',
  MetaESDT = 'MetaESDT',
}

registerEnumType(TokenType, {
  name: 'TokenType',
  description: 'Token type enum.',
  valuesMap: {
    FungibleESDT: {
      description: 'Fungible ESDT token type.',
    },
    MetaESDT: {
      description: 'Meta ESDT token type.',
    },
  },
});
