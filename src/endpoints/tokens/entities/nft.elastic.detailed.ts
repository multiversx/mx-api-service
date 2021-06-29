import { ApiProperty } from "@nestjs/swagger";
import { NftElastic } from "./nft.elastic";
import { NftElasticOwner } from "./nft.elastic.owner";

export class NftElasticDetailed extends NftElastic {
  @ApiProperty()
  owner: string = '';

  @ApiProperty()
  owners: NftElasticOwner[] = [];
}