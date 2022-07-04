import { ApiProperty } from '@nestjs/swagger';

export class Stats {
  constructor(init?: Partial<Stats>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  accounts: number = 0;

  @ApiProperty()
  blocks: number = 0;

  @ApiProperty()
  epoch: number = 0;

  @ApiProperty()
  refreshRate: number = 0;

  @ApiProperty()
  roundsPassed: number = 0;

  @ApiProperty()
  roundsPerEpoch: number = 0;

  @ApiProperty()
  shards: number = 0;

  @ApiProperty()
  transactions: number = 0;
}
