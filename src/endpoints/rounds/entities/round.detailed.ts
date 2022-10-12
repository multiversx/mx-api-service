import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { Round } from "./round";

@ObjectType("RoundDetailed", { description: "RoundDetailed object type." })
export class RoundDetailed extends Round {
  constructor(init?: Partial<RoundDetailed>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => [String],)
  @ApiProperty({ isArray: true })
  signers: string[] = [];
}
