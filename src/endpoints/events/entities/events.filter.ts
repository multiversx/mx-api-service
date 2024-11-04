
export class EventsFilter {
  constructor(init?: Partial<EventsFilter>) {
    Object.assign(this, init);
  }

  identifier: string = '';
  address: string = '';
  txHash: string = '';
  shard: number = 0;
  before: number = 0;
  after: number = 0;
}
