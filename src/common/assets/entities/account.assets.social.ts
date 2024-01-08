import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("AccountAssetsSocial", { description: "Account assets social object type." })
export class AccountAssetsSocial {
  constructor(init?: Partial<AccountAssetsSocial>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Website asset for the given account asset." })
  website: string = '';

  @Field(() => String, { description: "Blog assetfor the given account asset." })
  blog: string = '';

  @Field(() => String, { description: "Twitter asset for the given account asset." })
  twitter: string = '';

  @Field(() => String, { description: "Discord asset for the given account asset." })
  discord: string = '';

  @Field(() => String, { description: "Telegram asset for the given account asset." })
  telegram: string = '';

  @Field(() => String, { description: "Facebook asset for the given account asset." })
  facebook: string = '';

  @Field(() => String, { description: "Instagram asset for the given account asset." })
  instagram: string = '';

  @Field(() => String, { description: "YouTube asset for the given account asset." })
  youtube: string = '';

  @Field(() => String, { description: "Whitepapper asset for the given account asset." })
  whitepaper: string = '';

  @Field(() => String, { description: "Coinmarketcap asset for the given account asset." })
  coinmarketcap: string = '';

  @Field(() => String, { description: "Coingecko asset for the given account asset." })
  coingecko: string = '';

  @Field(() => String, { description: "Linkedin asset for the given account asset." })
  linkedin: string = '';

}
