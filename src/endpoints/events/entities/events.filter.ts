
export class EventsFilter {
  constructor(init?: Partial<EventsFilter>) {
    Object.assign(this, init);
  }

  identifier?: string;
  address?: string;
  txHash?: string;
  shard?: number;
  before?: number;
  after?: number;
  order?: number;
  logAddress?: string;
  topics?: string[];
}
