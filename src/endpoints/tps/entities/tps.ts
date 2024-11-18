import { ApiProperty } from "@nestjs/swagger";

export class Tps {
  constructor(init?: Partial<Tps>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'The number of transactions per second', type: Number, example: 10000 })
  tps: number = 0;

  @ApiProperty({ description: 'The timestamp when the TPS was recorder', type: Number, example: 1704070861 })
  timestamp: number = 0;
}
