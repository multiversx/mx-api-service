import { registerEnumType } from "@nestjs/graphql";

export enum NftSubType {
  NonFungibleESDT = 'NonFungibleESDT',
  SemiFungibleESDT = 'SemiFungibleESDT',
  MetaESDT = 'MetaESDT',
  NonFungibleESDTv2 = 'NonFungibleESDTv2',
  DynamicNonFungibleESDT = 'DynamicNonFungibleESDT',
  DynamicSemiFungibleESDT = 'DynamicSemiFungibleESDT',
  DynamicMetaESDT = 'DynamicMetaESDT',
  None = '',
}

registerEnumType(NftSubType, {
  name: 'NftSubType',
  description: 'NFT subtype.',
  valuesMap: {
    NonFungibleESDT: {
      description: 'Non-fungible ESDT NFT type.',
    },
    SemiFungibleESDT: {
      description: 'Semi-fungible ESDT NFT type.',
    },
    MetaESDT: {
      description: 'Meta ESDT NFT type.',
    },
    NonFungibleESDTv2: {
      description: 'Non-fungible ESDT v2 NFT type.',
    },
    DynamicNonFungibleESDT: {
      description: 'Dynamic non-fungible NFT type.',
    },
    DynamicSemiFungibleESDT: {
      description: 'Dynamic semi-fungible NFT type.',
    },
    DynamicMetaESDT: {
      description: 'Dynamic meta ESDT NFT type.',
    },
    None: {
      description: '',
    },
  },
});
