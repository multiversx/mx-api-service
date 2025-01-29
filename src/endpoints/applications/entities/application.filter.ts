export class ApplicationFilter {
  constructor(init?: Partial<ApplicationFilter>) {
    Object.assign(this, init);
  }

  after?: number;
  before?: number;
  withTxCount?: boolean;

  isSet(): boolean {
    return this.after !== undefined ||
      this.before !== undefined ||
      this.withTxCount !== undefined;
  }
}
