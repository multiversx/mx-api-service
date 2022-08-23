import { registerEnumType } from '@nestjs/graphql';

export enum ScamType {
  none = 'none',
  potentialScam = 'potentialScam',
  scam = 'scam'
}

registerEnumType(ScamType, {
  name: 'ScamType',
  description: 'Scam type object type.',
  valuesMap: {
    none: {
      description: 'No scam type.',
    },
    potentialScam: {
      description: 'Potential scam type.',
    },
    scam: {
      description: 'Scam type.',
    },
  },
});
