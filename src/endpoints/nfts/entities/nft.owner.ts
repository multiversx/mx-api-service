import { ApiProperty } from "@nestjs/swagger";

export class NftOwner {
  @ApiProperty()
  address: string = '';

  @ApiProperty()
  balance: string = '';
}