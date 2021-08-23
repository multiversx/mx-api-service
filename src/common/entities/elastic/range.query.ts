import { AbstractQuery } from "./abstract.query";
export class RangeQuery extends AbstractQuery {

  buildQuery(key: string, value: any): any {
    return { range: { [key]: { lte: value.before, gte: value.after } } };
  }
}