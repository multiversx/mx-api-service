import { ApiProperty } from "@nestjs/swagger";

export class NftMedia {
  @ApiProperty()
  url: string = '';

  @ApiProperty()
  originalUrl: string = '';

  @ApiProperty()
  thumbnailUrl: string = '';

  @ApiProperty()
  fileType: string = '';

  @ApiProperty()
  fileSize: number = 0;
}
