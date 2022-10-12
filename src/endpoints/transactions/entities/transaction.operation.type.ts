import { registerEnumType } from '@nestjs/graphql';

export enum TransactionOperationType {
  none = 'none',
  nft = 'nft',
  esdt = 'esdt',
  log = 'log',
  error = 'error',
  egld = 'egld'
}

registerEnumType(TransactionOperationType, {
  name: 'TransactionOperationType',
  description: 'Transaction operation type object type.',
  valuesMap: {
    none: {
      description: 'No operation type.',
    },
    nft: {
      description: 'NFT operation type.',
    },
    esdt: {
      description: 'ESDT operation type.',
    },
    log: {
      description: 'Log operation type.',
    },
    error: {
      description: 'Error operation type.',
    },
    egld: {
      description: 'EGLD operation type.',
    },
  },
});
