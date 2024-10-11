import { registerEnumType } from "@nestjs/graphql";

export enum TransactionType {
  Transaction = 'Transaction',
  SmartContractResult = 'SmartContractResult',
  InnerTransaction = 'InnerTransaction',
  Reward = 'Reward'
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
    InnerTransaction: {
      description: 'InnerTransaction type.',
    },
    Reward: {
      description: 'Reward type.',
    },
  },
});
