
export class AccountHistoryFilter {
  constructor(init?: Partial<AccountHistoryFilter>) {
    Object.assign(this, init);
  }
  before?: number;
  after?: number;
  identifiers?: string[];
  token?: string;
}
