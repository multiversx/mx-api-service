import { registerEnumType } from "@nestjs/graphql";

export enum ApplicationSort {
  balance = 'balance',
  transfersLast24h = 'transfersLast24h',
  timestamp = 'timestamp',
}

registerEnumType(ApplicationSort, {
  name: 'ApplicationSort',
  description: 'Application Sort object.',
  valuesMap: {
    balance: {
      description: 'Sort by balance.',
    },
    transfersLast24h: {
      description: 'Sort by transfersLast24h.',
    },
    timestamp: {
      description: 'Sort by timestamp.',
    },
  },
}); 
