import { Field } from '@nestjs/graphql';

export class EventsFilter {
  constructor(init?: Partial<EventsFilter>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Filter by identifier.' })
  identifier: string = '';

  @Field(() => String, { description: 'Filter by address.' })
  address: string = '';

  @Field(() => String, { description: 'Filter by txHash.' })
  txHash: string = '';

  @Field(() => Number, { description: 'Filter by shardID.' })
  shard: number = 0;

  @Field(() => Number, { description: 'Filter by before timestamp.' })
  before: number = 0;

  @Field(() => Number, { description: 'Filter by after timestamp.' })
  after: number = 0;
}
