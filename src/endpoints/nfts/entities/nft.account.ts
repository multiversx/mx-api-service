import { ApiProperty } from "@nestjs/swagger";
import { Nft } from "./nft";

export class NftAccount extends Nft {
  @ApiProperty()
  balance: string = '';
}