import { registerEnumType } from "@nestjs/graphql";

export enum MexPairStatus {
  active = 'Active',
  inactive = 'Inactive',
  paused = 'Paused',
  partial = 'Partial',
}

registerEnumType(MexPairStatus, {
  name: 'MexPairStatus',
  description: 'MexPairStatus object type.',
  valuesMap: {
    active: {
      description: 'Active state.',
    },
    inactive: {
      description: 'Inactive state.',
    },
    paused: {
      description: 'Pause state.',
    },
    partial: {
      description: 'Partial state.',
    },
  },
});
