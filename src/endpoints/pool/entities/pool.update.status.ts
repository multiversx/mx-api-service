// sent with every poolUpdate, so that clients know whether the pool it carries can be shown
export enum PoolUpdateStatus {
  success = 'success',
  tooLarge = 'tooLarge',
}
