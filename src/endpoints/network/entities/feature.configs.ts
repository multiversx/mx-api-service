import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("FeatureConfigs", { description: "FeatureConfigs object type." })
export class FeatureConfigs {
  constructor(init?: Partial<FeatureConfigs>) {
    Object.assign(this, init);
  }

  @Field(() => Boolean, { description: "Update Collection Extra Details flag details." })
  @ApiProperty({ description: 'Update Collection extra details flag activation value' })
  updateCollectionExtraDetails: boolean = false;

  @Field(() => Boolean, { description: "Marketplace flag details." })
  @ApiProperty({ description: 'Marketplace flag activation value' })
  marketplace: boolean = false;

  @Field(() => Boolean, { description: "Exchange flag details." })
  @ApiProperty({ description: 'Exchange flag activation value' })
  exchange: boolean = false;

  @Field(() => Boolean, { description: "DataApi flag details." })
  @ApiProperty({ description: 'DataApi flag activation value' })
  dataApi: boolean = false;
}
