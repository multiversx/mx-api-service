import { registerEnumType } from "@nestjs/graphql";

export enum TransactionType {
  Transaction = 'Transaction',
  SmartContractResult = 'SmartContractResult',
  Reward = 'Reward',
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
  description: 'Transaction type object type.',
  valuesMap: {
    Transaction: {
      description: 'Transaction type.',
    },
    SmartContractResult: {
      description: 'SmartContractResult type.',
    },
    Reward: {
      description: 'Reward type.',
    },
  },
});
