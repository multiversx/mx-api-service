import { AccountDetailed } from "./account.detailed";

export class Account {
  constructor(init?: Partial<Account>) {
    Object.assign(this, init);
  }

  account!: AccountDetailed;
}




