import { AbstractQuery } from "./abstract.query";
export class WildcardQuery extends AbstractQuery {

  buildQuery(key: string, value: any): any {
    return { wildcard: { [key]: value } };
  }
}