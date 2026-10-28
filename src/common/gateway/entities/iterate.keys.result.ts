export class IterateKeysResult {
  constructor(init?: Partial<IterateKeysResult>) {
    Object.assign(this, init);
  }

  pairs: Record<string, string> = {};

  blockInfo: any = undefined;
}
