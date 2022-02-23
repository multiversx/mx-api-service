import { AbstractQuery } from "./abstract.query";

export class MustQuery extends AbstractQuery {
  constructor(private readonly queries: AbstractQuery[]) {
    super();
  }

  getQuery(): any {
    return {
      bool: {
        must: this.queries.map(query => query.getQuery()),
      },
    };
  }
}
