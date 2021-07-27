import { QueryOperator } from "./query.operator";

export abstract class AbstractQuery {
  private query: any;

  constructor(
    key: string,
    value: any | undefined,
    operator: QueryOperator | undefined
  ) {
    this.query = this.buildQuery(key, value, operator);
  }

  abstract buildQuery(keyt: string, value: any | undefined, operator: QueryOperator | undefined): any;

  getQuery(): any {
    return this.query;
  }
}