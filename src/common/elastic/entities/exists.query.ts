import { AbstractQuery } from "./abstract.query";

export class ExistsQuery extends AbstractQuery {
  constructor(private readonly key: string) {
    super();
  }

  getQuery(): any {
    return { exists: { field: this.key } };
  }
}
