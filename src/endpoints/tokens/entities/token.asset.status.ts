import { registerEnumType } from "@nestjs/graphql";

export enum TokenAssetStatus {
  active = 'active',
  inactive = 'inactive'
}

registerEnumType(TokenAssetStatus, {
  name: 'TokenAssetStatus',
  description: 'Token asset status object type.',
  valuesMap: {
    active: {
      description: 'Active asset status.',
    },
    inactive: {
      description: 'Inactive asset status.',
    },
  },
});
