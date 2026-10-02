import { BlockInfo } from './block-info';

export class IterateKeysResponse {
  blockInfo?: BlockInfo;
  newIteratorState: string[] = [];
  pairs: { [key: string]: string } = {};

  constructor(init?: Partial<IterateKeysResponse>) {
    Object.assign(this, init);

    if (init?.blockInfo) {
      this.blockInfo = new BlockInfo(init.blockInfo);
    }
  }
}
