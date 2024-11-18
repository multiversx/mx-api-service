import { ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType("Events", { description: "Events object type." })
export class Events {
  constructor(init?: Partial<Events>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: "Transaction hash." })
  txHash: string = '';

  @ApiProperty({ description: "Log address." })
  logAddress: string = '';

  @ApiProperty({ description: "Event identifier." })
  identifier: string = '';

  @ApiProperty({ description: "Event address." })
  address: string = '';

  @ApiProperty({ description: "Event data." })
  data: string = '';

  @ApiProperty({ description: "Event topics." })
  topics: string[] = [];

  @ApiProperty({ description: "Event shard ID." })
  shardID: number = 0;

  @ApiProperty({ description: "Event additional data." })
  additionalData: string[] = [];

  @ApiProperty({ description: "Event tx order." })
  txOrder: number = 0;

  @ApiProperty({ description: "Event block order." })
  order: number = 0;

  @ApiProperty({ description: "Event timestamp." })
  timestamp: number = 0;
}
