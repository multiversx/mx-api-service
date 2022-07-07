import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from '@nestjs/swagger';
import { ScamType } from './scam-type.enum';

@ObjectType("ScamInformation")
export class ScamInfo {
  @Field(() => ScamType, { description: "Type for the given scam information." })
  @ApiProperty({ enum: ScamType })
  type: ScamType = ScamType.none;

  @Field(() => String, { description: "Information for the given scam.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  info?: string | null;

  static isScam(scamInfo: ScamInfo): boolean {
    return scamInfo.type !== ScamType.none;
  }

  static none(): ScamInfo {
    return {
      type: ScamType.none,
    };
  }
}
