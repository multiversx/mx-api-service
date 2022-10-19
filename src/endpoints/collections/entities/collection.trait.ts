import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { CollectionTraitAttribute } from "./collection.trait.attribute";

@ObjectType("CollectionTrait", { description: "NFT collection trait type." })
export class CollectionTrait {
  @Field(() => String, { description: 'Name of the trait.' })
  @ApiProperty({ type: String })
  name: string = '';

  @Field(() => Number, { description: 'Number of times the trait appears in the nft list.' })
  @ApiProperty({ type: Number })
  occurrenceCount: number = 0;

  @Field(() => Number, { description: 'Percentage for the occurrence of the trait in the nft list.' })
  @ApiProperty({ type: Number })
  occurrencePercentage: number = 0;

  @Field(() => [CollectionTraitAttribute], { description: 'Distinct attributes for the given trait.' })
  @ApiProperty({ type: CollectionTraitAttribute, isArray: true })
  attributes: CollectionTraitAttribute[] = [];
}
