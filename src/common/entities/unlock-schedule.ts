import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType("UnlockMileStoneModel", { description: "Unlock mile stone model object type." })
export class UnlockMileStoneModel {
  @Field(() => Float, { description: "Remaining epochs for the given unlock mile stone model." })
  @ApiProperty({ type: Number, description: 'Remaining epochs until unlock can be performed', example: 42 })
  remainingEpochs: number = 0;

  @Field(() => Float, { description: "Percent for the given unlock mile stone model." })
  @ApiProperty({ type: Number, description: 'Percent of token unlockable after the epochs pass', example: 42 })
  percent: number = 0;

  constructor(init?: Partial<UnlockMileStoneModel>) {
    Object.assign(this, init);
  }
}
