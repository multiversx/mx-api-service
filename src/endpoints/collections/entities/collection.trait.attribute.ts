import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("CollectionTraitAttribute", { description: "NFT collection trait attribute type." })
export class CollectionTraitAttribute {
  @Field(() => String, { description: 'Name of the attribute.', nullable: true })
  @ApiProperty({ type: String })
  name: string = '';

  @Field(() => Number, { description: 'Number of times the attribute appears in the nft list.' })
  @ApiProperty({ type: Number })
  occurrenceCount: number = 0;

  @Field(() => Number, { description: 'Percentage for the occurrence of the attribute in the nft list.' })
  @ApiProperty({ type: Number })
  occurrencePercentage: number = 0;
}
