import { registerEnumType } from "@nestjs/graphql";

export enum MexPairExchange {
  xexchange = 'xexchange',
  jungledex = 'jungledex',
  unknown = 'unknown'
}

registerEnumType(MexPairExchange, {
  name: 'MexPairExchange',
  description: 'MexPairExchange object type.',
  valuesMap: {
    xexchange: {
      description: 'xexchange',
    },
    jungledex: {
      description: 'jungledex',
    },
    unknown: {
      description: 'unknown',
    },
  },
});
