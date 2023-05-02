import { registerEnumType } from "@nestjs/graphql";

export enum MexPairExchangeType {
  xexchange = 'xexchange',
  jungledex = 'jungledex',
  none = 'none'
}

registerEnumType(MexPairExchangeType, {
  name: 'MexPairExchangeType',
  description: 'MexPairExchangeType object type.',
  valuesMap: {
    xexchange: {
      description: 'xexchange',
    },
    jungledex: {
      description: 'jungledex',
    },
    none: {
      description: 'none',
    },
  },
});
