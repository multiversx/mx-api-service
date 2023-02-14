export class CollectionQueryOptions {
  constructor(init?: Partial<CollectionQueryOptions>) {
    Object.assign(this, init);
  }

  withAuctionStats?: boolean;
}
