export class AuctionsFilter {
  constructor(init?: Partial<AuctionsFilter>) {
    Object.assign(this, init);
  }

  marketplace: string = '';
}
