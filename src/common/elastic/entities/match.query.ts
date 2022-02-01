import { AbstractQuery } from "./abstract.query";
import { QueryOperator } from "./query.operator";

export class MatchQuery extends AbstractQuery {
  constructor(
    private readonly key: string,
    private readonly value: any,
    private readonly operator: QueryOperator | undefined = undefined
  ) {
    super();
  }

  getQuery(): any {
    if (!this.operator) {
      return { match: { [this.key]: this.value } };
    }

    return {
      match: {
        [this.key]: {
          query: this.value,
          operator: this.operator,
        },
      },
    };
  }
}
