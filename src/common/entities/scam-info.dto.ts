import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from '@nestjs/swagger';

@ObjectType("ScamInformation", { description: "Scam information object type." })
export class ScamInfo {
  @Field(() => String, { description: "Type for the given scam information." })
  @ApiProperty({ type: String })
  type?: string | null;

  @Field(() => String, { description: "Information for the given scam.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  info?: string | null;
}
