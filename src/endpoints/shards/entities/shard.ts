import { ApiProperty } from "@nestjs/swagger";

export class Shard {
  constructor(init?: Partial<Shard>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number, example: 1 })
  shard: number = 0;

  @ApiProperty({ type: Number, example: 800 })
  validators: number = 0;

  @ApiProperty({ type: Number, example: 800 })
  activeValidators: number = 0;
}
