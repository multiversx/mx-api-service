import { registerEnumType } from "@nestjs/graphql";

export enum TokenAssetsPriceSourceType {
  dataApi = 'dataApi',
}

registerEnumType(TokenAssetsPriceSourceType, {
  name: 'TokenAssetsPriceSourceType',
  description: 'Token Assets Price Source Type object type.',
  valuesMap: {
    dataApi: {
      description: 'Data API type.',
    },
  },
});
