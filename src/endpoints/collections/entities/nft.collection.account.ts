import { ApiProperty } from "@nestjs/swagger";
import { NftCollection } from "./nft.collection";

export class NftCollectionAccount extends NftCollection {
  constructor(init?: Partial<NftCollectionAccount>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty()
  count: number = 0;
}
