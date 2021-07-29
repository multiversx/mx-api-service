import { AbstractQuery } from "./abstract.query";
import { QueryOperator } from "./query.operator";

export class MatchQuery extends AbstractQuery {

  buildQuery(key: string, value: any, operator: QueryOperator | undefined): any {
    if (!operator) {
      return { match: { [key]: value } };
    }

    return {
      match: {
        [key]: {
        query: value,
        operator: operator
        }
      }
    }
  }
}