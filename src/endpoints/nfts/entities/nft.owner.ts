import { ApiProperty } from "@nestjs/swagger";

export class NftOwner {
  @ApiProperty({type: String})
  address: string = '';

  @ApiProperty({type: String, default: 0})
  balance: string = '';
}
