export class AuctionNode {
  constructor(init?: Partial<AuctionNode>) {
    Object.assign(this, init);
  }

  blsKey: string = '';

  qualified: boolean = false;
}
