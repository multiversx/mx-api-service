import { registerEnumType } from "@nestjs/graphql";

export enum MexPairState {
  active = 'active',
  inactive = 'inactive',
  paused = 'paused',
  partial = 'partial',
}

registerEnumType(MexPairState, {
  name: 'MexPairState',
  description: 'MexPairState object type.',
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
