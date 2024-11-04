import { ApiProperty } from "@nestjs/swagger";
import { FeatureConfigs } from "./feature.configs";

export class About {
  constructor(init?: Partial<About>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, nullable: true })
  appVersion: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  pluginsVersion: string | undefined = undefined;

  @ApiProperty({ type: String })
  network: string = '';

  @ApiProperty({ type: String, required: false })
  cluster: string = '';

  @ApiProperty({ type: String })
  version: string = '';

  @ApiProperty({ type: String })
  indexerVersion: string | undefined = undefined;

  @ApiProperty({ type: String })
  gatewayVersion: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  scamEngineVersion: string | undefined = undefined;

  @ApiProperty({ type: FeatureConfigs, nullable: true })
  features: FeatureConfigs | undefined = undefined;
}
