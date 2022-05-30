import { ApiProperty } from "@nestjs/swagger";

export class NftMetadata {
  @ApiProperty()
  description: string = '';

  @ApiProperty()
  fileType: string = '';

  @ApiProperty()
  fileUri: string = '';

  @ApiProperty()
  fileName: string = '';
}
