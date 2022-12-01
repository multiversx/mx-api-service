import { registerEnumType } from '@nestjs/graphql';

export enum EsdtType {
  FungibleESDT = 'FungibleESDT',
  NonFungibleESDT = 'NonFungibleESDT',
  SemiFungibleESDT = 'SemiFungibleESDT',
  MetaESDT = 'MetaESDT',
}

registerEnumType(EsdtType, {
  name: 'EsdtType',
  description: 'Esdt type enum.',
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
