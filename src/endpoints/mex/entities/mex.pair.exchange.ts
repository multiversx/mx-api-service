import { registerEnumType } from "@nestjs/graphql";

export enum MexPairExchange {
  xexchange = 'xexchange',
  unknown = 'unknown'
}

registerEnumType(MexPairExchange, {
  name: 'MexPairExchange',
  description: 'MexPairExchange object type.',
  valuesMap: {
    xexchange: {
      description: 'xexchange',
    },
    unknown: {
      description: 'unknown',
    },
  },
});
