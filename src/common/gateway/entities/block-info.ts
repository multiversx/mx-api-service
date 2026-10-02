export class BlockInfo {
  hash: string = '';
  nonce: number = 0;
  rootHash: string = '';

  constructor(init?: Partial<BlockInfo>) {
    Object.assign(this, init);
  }
} 
