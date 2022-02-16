import { AbstractQuery } from "./abstract.query";
export class RangeQuery extends AbstractQuery {
  constructor(
    private readonly key: string,
    private readonly before: number | undefined,
    private readonly after: number | undefined,
  ) {
    super();
  }

  getQuery(): any {
    return { range: { [this.key]: { lte: this.before, gte: this.after } } };
  }
}
