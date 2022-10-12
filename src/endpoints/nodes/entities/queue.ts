import { ApiProperty } from "@nestjs/swagger";

export class Queue {
  constructor(init?: Partial<Queue>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  bls: string = '';

  @ApiProperty()
  nonce: number = 0;

  @ApiProperty()
  rewardsAddress: string = '';

  @ApiProperty()
  position: number = 0;
}
