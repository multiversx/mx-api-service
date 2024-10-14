import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType("Events", { description: "Events object type." })
export class Events{
  constructor(init?: Partial<Events>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Transaction hash event details.' })
  txHash: string = '';

  @Field(() => String, { description: 'Log address event details.' })
  logAddress: string = '';

  @Field(() => String, { description: 'Identifier event details.' })
  identifier: string = '';

  @Field(() => String, { description: 'Address details.' })
  address: string = '';

  @Field(() => String, { description: 'Event data details.' })
  data: string = '';

  @Field(() => [String], { description: 'Event topics details.' })
  topics: string[] = [];

  @Field(() => Number, { description: 'Shard ID details.' })
  shardID: number = 0;

  @Field(() => [String], { description: 'Event additional data details.' })
  additionalData: string[] = [];

  @Field(() => Number, { description: 'Event tx order details.' })
  txOrder: number = 0;

  @Field(() => Number, { description: 'Event order details.' })
  order: number = 0;

  @Field(() => Number, { description: 'Event timestamp details.' })
  timestamp: number = 0;
}
