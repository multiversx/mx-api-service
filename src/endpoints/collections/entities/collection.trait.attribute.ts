import { ApiProperty } from "@nestjs/swagger";

export class CollectionTraitAttribute {
  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: Number })
  occurrenceCount: number = 0;

  @ApiProperty({ type: Number })
  occurrencePercentage: number = 0;
}
