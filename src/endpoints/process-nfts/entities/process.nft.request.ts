import { ApiProperty } from "@nestjs/swagger";

export class ProcessNftRequest {
  constructor(init?: Partial<ProcessNftRequest>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, nullable: true , required: false })
  collection?: string;

  @ApiProperty({ type: String, nullable: true , required: false })
  identifier?: string;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  forceRefreshMedia?: boolean;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  forceRefreshMetadata?: boolean;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  forceRefreshThumbnail?: boolean;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  skipRefreshThumbnail?: boolean;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  uploadAsset?: boolean;
}
