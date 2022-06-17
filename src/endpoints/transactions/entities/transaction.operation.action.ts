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
