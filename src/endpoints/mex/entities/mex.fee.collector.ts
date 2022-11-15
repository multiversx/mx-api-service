import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("MexFeesCollector", { description: "MexFeesCollector object type." })
export class MexFeesCollector {
  constructor(init?: Partial<MexFeesCollector>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Address details." })
  @ApiProperty({ type: String, example: 'erd1qqqqqqqqqqqqqpgqur83hqn9j4y6v93m09nn2q0yazuhk2rvpr9sarz5yj' })
  address: string = '';
}
