import { ApiProperty } from '@nestjs/swagger';
import { ScamType } from './scam-type.enum';

export class ScamInfo {
  @ApiProperty({ enum: ScamType })
  type: ScamType = ScamType.none;

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
