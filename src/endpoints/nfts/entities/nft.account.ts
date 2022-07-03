import { ApiProperty } from "@nestjs/swagger";
import { Nft } from "./nft";

export class NftAccount extends Nft {
  constructor(init?: Partial<NftAccount>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: 10 })
  balance: string = '';

  @ApiProperty({ type: Number, nullable: true })
  price: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  valueUsd: number | undefined = undefined;
}
