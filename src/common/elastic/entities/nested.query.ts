import { AbstractQuery } from "./abstract.query";
import { QueryType } from "./query.type";

export class NestedQuery extends AbstractQuery {
  constructor(
    private readonly key: string,
    private readonly value: any
  ) {
    super();
  }

  getQuery(): any {
    return {
      nested: {
        path: this.key,
        query: {
          bool: {
            must: [
              QueryType.Match(Object.keys(this.value)[0], Object.values(this.value)[0]).getQuery(),
            ],
          },
        },
      },
    };
  }
}
