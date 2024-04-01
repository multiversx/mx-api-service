import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { FeatureConfigs } from "./feature.configs";

@ObjectType("About", { description: "About object type." })
export class About {
  constructor(init?: Partial<About>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Application Version details." })
  @ApiProperty({ type: String, nullable: true })
  appVersion: string | undefined = undefined;

  @Field(() => String, { description: "Plugins Version details." })
  @ApiProperty({ type: String, nullable: true })
  pluginsVersion: string | undefined = undefined;

  @Field(() => String, { description: "Current network details." })
  @ApiProperty({ type: String })
  network: string = '';

  @Field(() => String, { description: "Deployment cluster." })
  @ApiProperty({ type: String })
  cluster: string = '';

  @Field(() => String, { description: "API deployment version." })
  @ApiProperty({ type: String })
  version: string = '';

  @Field(() => String, { description: "Indexer version.", nullable: true })
  @ApiProperty({ type: String })
  indexerVersion: string | undefined = undefined;

  @Field(() => String, { description: "Gateway version.", nullable: true })
  @ApiProperty({ type: String })
  gatewayVersion: string | undefined = undefined;

  @Field(() => String, { description: "Scam engine version.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  scamEngineVersion: string | undefined = undefined;

  @Field(() => FeatureConfigs, { description: "Feature Flags.", nullable: true })
  @ApiProperty({ type: FeatureConfigs, nullable: true })
  features: FeatureConfigs | undefined = undefined;
}
