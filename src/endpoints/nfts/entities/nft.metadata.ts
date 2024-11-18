import { ApiProperty } from "@nestjs/swagger";
import { NftMetadataError } from "./nft.metadata.error";

export class NftMetadata {
  constructor(init?: Partial<NftMetadata>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  description: string = '';

  @ApiProperty()
  fileType: string = '';

  @ApiProperty()
  fileUri: string = '';

  @ApiProperty()
  fileName: string = '';

  @ApiProperty({ type: NftMetadataError, nullable: true })
  error: NftMetadataError | undefined = undefined;
}
