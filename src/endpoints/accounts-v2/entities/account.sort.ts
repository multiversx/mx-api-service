import { registerEnumType } from "@nestjs/graphql";

export enum AccountSort {
  balance = 'balance',
  timestamp = 'timestamp',
  transfersLast24h = 'transfersLast24h',
}

registerEnumType(AccountSort, {
  name: 'AccountSort',
  description: 'Account Sort object.',
  valuesMap: {
    balance: {
      description: 'Sort by balance.',
    },
    timestamp: {
      description: 'Sort by timestamp.',
    },
    transfersLast24h: {
      description: 'Sort by transfersLast24h.',
    },
  },
});
