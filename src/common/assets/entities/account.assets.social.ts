import { ObjectType } from "@nestjs/graphql";

@ObjectType("AccountAssetsSocial", { description: "Account assets social object type." })
export class AccountAssetsSocial {
  constructor(init?: Partial<AccountAssetsSocial>) {
    Object.assign(this, init);
  }

  website: string = '';
  email: string = '';
  blog: string = '';
  twitter: string = '';
  discord: string = '';
  telegram: string = '';
  facebook: string = '';
  instagram: string = '';
  youtube: string = '';
  whitepaper: string = '';
  coinmarketcap: string = '';
  coingecko: string = '';
  linkedin: string = '';
}
