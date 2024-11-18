import { ApiProperty } from "@nestjs/swagger";
import { NftMetadataErrorCode } from "./nft.metadata.error.code";

export class NftMetadataError {
  @ApiProperty({ enum: NftMetadataErrorCode })
  code: NftMetadataErrorCode = NftMetadataErrorCode.unknownError;

  @ApiProperty()
  message: string = '';

  @ApiProperty()
  timestamp: number = 0;
}
