import { AbstractQuery } from "./abstract.query";
import { QueryOperator } from "./query.operator";

export class WildcardQuery extends AbstractQuery {

  buildQuery(key: string, value: any, operator: QueryOperator | undefined): any {
    if (!operator) {
      return { wildcard: { [key]: value } };
    }

    return {
      wildcard: {
        [key]: {
        query: value,
        operator: operator
        }
      }
    }
  }
}