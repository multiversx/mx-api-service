import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("MexTokenChart", { description: "MexTokenChart object type." })
export class MexTokenChart {
  constructor(init?: Partial<MexTokenChart>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Timestamp details." })
  @ApiProperty()
  timestamp: number = 0;

  @Field(() => String, { description: "Value details." })
  @ApiProperty()
  value: number = 0;
}
