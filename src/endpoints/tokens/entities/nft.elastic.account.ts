import { ApiProperty } from "@nestjs/swagger";
import { NftElastic } from "./nft.elastic";

export class NftElasticAccount extends NftElastic {
  @ApiProperty()
  balance: string = '';
}