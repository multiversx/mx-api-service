import { AbstractQuery } from "./abstract.query";
export class WildcardQuery extends AbstractQuery {
  constructor(
    private readonly key: string,
    private readonly value: string
  ) {
    super();
  }

  getQuery(): any {
    return { wildcard: { [this.key]: this.value } };
  }
}
