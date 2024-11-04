import { ApiProperty } from "@nestjs/swagger";

export class Shard {
  constructor(init?: Partial<Shard>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'Shard details', type: Number, example: 1 })
  shard: number = 0;

  @ApiProperty({ description: 'Validators details', type: Number, example: 800 })
  validators: number = 0;

  @ApiProperty({ description: 'Active validators details', type: Number, example: 800 })
  activeValidators: number = 0;
}
