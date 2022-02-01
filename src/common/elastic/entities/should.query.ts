import { AbstractQuery } from "./abstract.query";

export class ShouldQuery extends AbstractQuery {
  constructor(private readonly queries: AbstractQuery[]) {
    super();
  }

  getQuery(): any {
    return {
      bool: {
        should: this.queries.map(query => query.getQuery()),
      },
    };
  }
}
