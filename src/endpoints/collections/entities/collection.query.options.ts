export class CollectionQueryOptions {
  constructor(init?: Partial<CollectionQueryOptions>) {
    Object.assign(this, init);
  }

  withAuctions?: boolean = false;
}
