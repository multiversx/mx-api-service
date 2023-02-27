import { registerEnumType } from "@nestjs/graphql";

export enum AccountSort {
  balance = 'balance',
  timestamp = 'timestamp',
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
  },
});
