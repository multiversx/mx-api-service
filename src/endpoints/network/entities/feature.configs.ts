import { ApiProperty } from "@nestjs/swagger";

export class FeatureConfigs {
  constructor(init?: Partial<FeatureConfigs>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'Update Collection extra details flag activation value' })
  updateCollectionExtraDetails: boolean = false;

  @ApiProperty({ description: 'Marketplace flag activation value' })
  marketplace: boolean = false;

  @ApiProperty({ description: 'Exchange flag activation value' })
  exchange: boolean = false;

  @ApiProperty({ description: 'DataApi flag activation value' })
  dataApi: boolean = false;
}
