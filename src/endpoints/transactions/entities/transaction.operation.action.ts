import { registerEnumType } from '@nestjs/graphql';

export enum TransactionOperationAction {
  none = 'none',
  transfer = 'transfer',
  transferValueOnly = 'transferValueOnly',
  burn = 'burn',
  addQuantity = 'addQuantity',
  create = 'create',
  localMint = 'localMint',
  localBurn = 'localBurn',
  wipe = 'wipe',
  freeze = 'freeze',
  writeLog = 'writeLog',
  signalError = 'signalError',
}

registerEnumType(TransactionOperationAction, {
  name: 'TransactionOperationAction',
  description: 'Transaction operation action object type.',
  valuesMap: {
    none: {
      description: 'No operation operation action.',
    },
    transfer: {
      description: 'Transafer operation action.',
    },
    transferValueOnly: {
      description: 'Transfer only value operation action.',
    },
    burn: {
      description: 'Burn operation action.',
    },
    addQuantity: {
      description: 'Add quantity operation action.',
    },
    create: {
      description: 'Create operation action.',
    },
    localMint: {
      description: 'Local mint operation action.',
    },
    localBurn: {
      description: 'Local burn operation action.',
    },
    wipe: {
      description: 'Wipe operation action.',
    },    
    freeze: {
      description: 'Freeze operation action.',
    },    
    writeLog: {
      description: 'Write log operation action.',
    },    
    signalError: {
      description: 'Signal error operation action.',
    },
  },
});
