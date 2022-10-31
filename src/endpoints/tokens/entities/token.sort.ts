import { registerEnumType } from "@nestjs/graphql";

export enum TokenSort {
  accounts = 'accounts',
  transactions = 'transactions',
  price = 'price',
  marketCap = 'marketCap'
}

registerEnumType(TokenSort, {
  name: 'TokenSort',
  description: 'Token Sort object type.',
  valuesMap: {
    accounts: {
      description: 'Accounts sort.',
    },
    transactions: {
      description: 'Transactions sort.',
    },
    price: {
      description: 'Price sort.',
    },
    marketCap: {
      description: 'MarketCap sort.',
    },
  },
});
