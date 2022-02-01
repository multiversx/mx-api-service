import { AbstractQuery } from "./abstract.query";

export class TermsQuery extends AbstractQuery {
  constructor(
    private readonly key: string,
    private readonly value: string[],
  ) {
    super();
  }

  getQuery(): any {
    return {
      [this.key]: this.value,
    };
  }
}
