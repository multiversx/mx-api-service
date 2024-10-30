import { ApiProperty } from "@nestjs/swagger";

export class UnlockMileStoneModel {
  @ApiProperty({ type: Number, description: 'Remaining epochs until unlock can be performed', example: 42 })
  remainingEpochs: number = 0;

  @ApiProperty({ type: Number, description: 'Percent of token unlockable after the epochs pass', example: 42 })
  percent: number = 0;

  constructor(init?: Partial<UnlockMileStoneModel>) {
    Object.assign(this, init);
  }
}
