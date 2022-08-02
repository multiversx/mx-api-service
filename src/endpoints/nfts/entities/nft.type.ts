import { registerEnumType } from "@nestjs/graphql";

export enum NftType {
  NonFungibleESDT = 'NonFungibleESDT',
  SemiFungibleESDT = 'SemiFungibleESDT',
  MetaESDT = 'MetaESDT',
}

registerEnumType(NftType, {
  name: 'NftType',
  description: 'NFT type.',
  valuesMap: {
    NonFungibleESDT: {
      description: 'Non-fungible NFT type.',
    },
    SemiFungibleESDT: {
      description: 'Semi-fungible NFT type.',
    },
    MetaESDT: {
      description: 'Meta ESDT NFT type.',
    },
  },
});
