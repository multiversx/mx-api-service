import { ApiProperty } from "@nestjs/swagger";

export class NftElasticOwner {
  @ApiProperty()
  address: string = '';

  @ApiProperty()
  balance: string = '';
}