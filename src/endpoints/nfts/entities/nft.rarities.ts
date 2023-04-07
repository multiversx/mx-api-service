import { Field } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { NftRarity } from "./nft.rarity";

export class NftRarities {
  constructor(init?: Partial<NftRarities>) {
    Object.assign(this, init);
  }

  @Field(() => NftRarity, { description: "Statistical rarity information." })
  @ApiProperty({ type: NftRarity })
  statistical: NftRarity | undefined;

  @Field(() => NftRarity, { description: "Trait-based rarity information." })
  @ApiProperty({ type: NftRarity })
  trait: NftRarity | undefined;

  @Field(() => NftRarity, { description: "Jaccard distances rarity information." })
  @ApiProperty({ type: NftRarity })
  jaccardDistances: NftRarity | undefined;

  @Field(() => NftRarity, { description: "OpenRarity information." })
  @ApiProperty({ type: NftRarity })
  openRarity: NftRarity | undefined;

  @Field(() => NftRarity, { description: "Custom rarity information." })
  @ApiProperty({ type: NftRarity })
  custom: NftRarity | undefined;
}
