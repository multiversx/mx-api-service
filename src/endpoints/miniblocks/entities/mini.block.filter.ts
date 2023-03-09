
export class MiniBlockFilter {
  constructor(init?: Partial<MiniBlockFilter>) {
    Object.assign(this, init);
  }
  hashes?: string[];
}
