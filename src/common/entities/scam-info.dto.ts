import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from '@nestjs/swagger';
import { ScamType } from './scam-type.enum';

@ObjectType("ScamInformation", { description: "Scam information object type." })
export class ScamInfo {
  constructor(init?: Partial<ScamInfo>) {
    Object.assign(this, init);
  }

  @Field(() => ScamType, { description: "Type for the given scam information." })
  type?: string | null;

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
