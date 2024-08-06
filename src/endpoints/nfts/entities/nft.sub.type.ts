import { registerEnumType } from "@nestjs/graphql";

export enum NftSubType {
  NonFungibleESDTv2 = 'NonFungibleESDTv2',
  DynamicNonFungibleESDT = 'DynamicNonFungibleESDT',
  DynamicSemiFungibleESDT = 'DynamicSemiFungibleESDT',
  DynamicMetaESDT = 'DynamicMetaESDT',
}

registerEnumType(NftSubType, {
  name: 'NftType',
  description: 'NFT type.',
  valuesMap: {
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
  },
});
