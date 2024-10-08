import { registerEnumType } from "@nestjs/graphql";

export enum TokenAssetsPriceSourceType {
  dataApi = 'dataApi',
  customUrl = 'customUrl',
}

registerEnumType(TokenAssetsPriceSourceType, {
  name: 'TokenAssetsPriceSourceType',
  description: 'Token Assets Price Source Type object type.',
  valuesMap: {
    dataApi: {
      description: 'Data API type.',
    },
    customUrl: {
      description: 'Custom URL to fetch price.',
    },
  },
});
