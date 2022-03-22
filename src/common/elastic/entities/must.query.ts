import { AbstractQuery } from "./abstract.query";

export class MustQuery extends AbstractQuery {
  constructor(
    private readonly queries: AbstractQuery[],
    private readonly mustNotQueries: AbstractQuery[] = []
  ) {
    super();
  }

  getQuery(): any {
    return {
      bool: {
        must: this.queries.map(query => query.getQuery()),
        must_not: this.mustNotQueries.map(query => query.getQuery()),
      },
    };
  }
}
