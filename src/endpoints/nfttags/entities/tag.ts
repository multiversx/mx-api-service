import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("Tag", { description: "Tag object type." })
export class Tag {
  constructor(init?: Partial<Tag>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Tag details.' })
  @ApiProperty({ type: String, nullable: true, example: 'sunny' })
  tag: string = '';

  @Field(() => Float, { description: 'Count for the given tag.', nullable: true })
  @ApiProperty({ type: Number, nullable: true, example: 46135 })
  count: number | undefined = undefined;
}
