import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("About", { description: "About object type." })
export class About {
  constructor(init?: Partial<About>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Application Version details." })
  @ApiProperty({ type: String })
  appVersion: string = '';

  @Field(() => String, { description: "Plugins Version details." })
  @ApiProperty({ type: String, nullable: true })
  pluginsVersion: string | undefined = undefined;

  @Field(() => String, { description: "Current network details." })
  @ApiProperty({ type: String })
  network: string = '';

  @ApiProperty({ type: String })
  cluster: string = '';

  @Field(() => String, { description: "API deployment version." })
  @ApiProperty({ type: String })
  version: string = '';

  @ApiProperty({ type: String })
  scamEngineVersion: string = '';
}
