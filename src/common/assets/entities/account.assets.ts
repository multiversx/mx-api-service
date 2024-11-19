import { ObjectType } from "@nestjs/graphql";
import { AccountAssetsSocial } from "./account.assets.social";

@ObjectType("AccountAssets", { description: "Account assets object type." })
export class AccountAssets {
  constructor(init?: Partial<AccountAssets>) {
    Object.assign(this, init);
  }

  name: string = '';
  description: string = '';
  social: AccountAssetsSocial | undefined = undefined;
  tags: string[] = [];
  proof: string | undefined = undefined;
  icon: string | undefined = undefined;
  iconPng: string | undefined = undefined;
  iconSvg: string | undefined = undefined;
}
