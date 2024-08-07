import { registerEnumType } from '@nestjs/graphql';

export enum EsdtSubType {
  NonFungibleESDTv2 = 'NonFungibleESDTv2',
  DynamicNonFungibleESDT = 'DynamicNonFungibleESDT',
  DynamicSemiFungibleESDT = 'DynamicSemiFungibleESDT',
  DynamicMetaESDT = 'DynamicMetaESDT',
}

registerEnumType(EsdtSubType, {
  name: 'EsdtSubType',
  description: 'Esdt sub type enum.',
  valuesMap: {
    NonFungibleESDTv2: {
      description: 'Non-fungible ESDT v2 sub type.',
    },
    DynamicNonFungibleESDT: {
      description: 'Dynamic non-fungible sub type.',
    },
    DynamicSemiFungibleESDT: {
      description: 'Dynamic semi-fungible sub type.',
    },
    DynamicMetaESDT: {
      description: 'Dynamic meta ESDT sub type.',
    },
  },
});
