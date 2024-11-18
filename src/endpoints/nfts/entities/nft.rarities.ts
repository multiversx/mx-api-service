import { ApiProperty } from "@nestjs/swagger";
import { NftRarity } from "./nft.rarity";

export class NftRarities {
  constructor(init?: Partial<NftRarities>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: NftRarity })
  statistical: NftRarity | undefined;

  @ApiProperty({ type: NftRarity })
  trait: NftRarity | undefined;

  @ApiProperty({ type: NftRarity })
  jaccardDistances: NftRarity | undefined;

  @ApiProperty({ type: NftRarity })
  openRarity: NftRarity | undefined;

  @ApiProperty({ type: NftRarity })
  custom: NftRarity | undefined;
}
