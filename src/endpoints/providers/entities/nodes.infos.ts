import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("NodesInfos", { description: "NodesInfos object type." })
export class NodesInfos {
  constructor(init?: Partial<NodesInfos>) {
    Object.assign(this, init);
  }

  @Field(() => Float, { description: "Total numbers of nodes." })
  @ApiProperty()
  numNodes: number = 0;

  @Field(() => Float, { description: "Total stake amount." })
  @ApiProperty()
  stake: string = '';

  @Field(() => String, { description: "Top up details." })
  @ApiProperty()
  topUp: string = '';

  @Field(() => String, { description: "Locked amound details." })
  @ApiProperty()
  locked: string = '';
}
