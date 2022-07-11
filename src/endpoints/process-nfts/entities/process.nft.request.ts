import { ApiProperty } from "@nestjs/swagger";

export class ProcessNftRequest {
  constructor(init?: Partial<ProcessNftRequest>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, nullable: true })
  collection?: string;

  @ApiProperty({ type: String, nullable: true })
  identifier?: string;

  @ApiProperty({ type: Boolean, nullable: true })
  forceRefreshMedia?: boolean;

  @ApiProperty({ type: Boolean, nullable: true })
  forceRefreshMetadata?: boolean;

  @ApiProperty({ type: Boolean, nullable: true })
  forceRefreshThumbnail?: boolean;

  @ApiProperty({ type: Boolean, nullable: true })
  skipRefreshThumbnail?: boolean;

  @ApiProperty({ type: Boolean, nullable: true })
  forceUploadAsset?: boolean;
}
