import { ApiProperty } from '@nestjs/swagger';
import { ScamType } from './scam-type.enum';

export class ScamInfo {
  constructor(init?: Partial<ScamInfo>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, nullable: true })
  type?: string | null;

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
