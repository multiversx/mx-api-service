import { registerEnumType } from '@nestjs/graphql';

export enum TransactionStatus {
  success = 'success',
  pending = 'pending',
  invalid = 'invalid',
  fail = 'fail'
}

registerEnumType(TransactionStatus, {
  name: 'TransactionStatus',
  description: 'Transaction status object type.',
  valuesMap: {
    success: {
      description: 'Success status.',
    },
    pending: {
      description: 'Pending status.',
    },
    invalid: {
      description: 'Invalid status.',
    },
    fail: {
      description: 'Fail status.',
    },
  },
});
