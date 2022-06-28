import { ApiProperty } from "@nestjs/swagger";

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
}
