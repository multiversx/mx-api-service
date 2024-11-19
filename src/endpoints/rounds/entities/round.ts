import { ApiProperty } from "@nestjs/swagger";

export class Round {
  constructor(init?: Partial<Round>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Boolean, default: false })
  blockWasProposed: boolean = false;

  @ApiProperty({ type: Number, example: 9171722 })
  round: number = 0;

  @ApiProperty({ type: Number, example: 1 })
  shard: number = 0;

  @ApiProperty({ type: Number, example: 636 })
  epoch: number = 0;

  @ApiProperty({ type: Number, example: 1651148112 })
  timestamp: number = 0;
}
