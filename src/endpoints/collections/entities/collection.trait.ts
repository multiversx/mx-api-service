import { ApiProperty } from "@nestjs/swagger";
import { CollectionTraitAttribute } from "./collection.trait.attribute";

export class CollectionTrait {
  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: Number })
  occurrenceCount: number = 0;

  @ApiProperty({ type: Number })
  occurrencePercentage: number = 0;

  @ApiProperty({ type: CollectionTraitAttribute, isArray: true })
  attributes: CollectionTraitAttribute[] = [];
}
