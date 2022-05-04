import { ApiProperty } from "@nestjs/swagger";
import { Nft } from "./nft";

export class NftAccount extends Nft {
  @ApiProperty({ type: String, example: 10 })
  balance: string = '';
}
