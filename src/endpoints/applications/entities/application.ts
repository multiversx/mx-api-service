import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("Application", { description: "Application object type." })
export class Application {
  constructor(init?: Partial<Application>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Contract address details." })
  @ApiProperty({ type: String })
  contract: string = '';

  @Field(() => String, { description: "Deployer address details." })
  @ApiProperty({ type: String })
  deployer: string = '';

  @Field(() => String, { description: "Owner address details." })
  @ApiProperty({ type: String })
  owner: string = '';

  @Field(() => String, { description: "Code hash details." })
  @ApiProperty({ type: String })
  codeHash: string = '';

  @Field(() => Float, { description: "Timestamp details." })
  @ApiProperty({ type: Number })
  timestamp: number = 0;
}
