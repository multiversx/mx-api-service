export class IterateKeysRequest {
  constructor(init?: Partial<IterateKeysRequest>) {
    Object.assign(this, init);
  }

  address: string = '';
  numKeys: number = 0;
  iteratorState: string[] = [];
} 
