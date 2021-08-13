import { AbstractQuery } from "./abstract.query";
import { QueryType } from "./query.type";

export class NestedQuery extends AbstractQuery {

  buildQuery(key: string, value: any): any {
    return { 
      nested: {
        path: key,
        query: {
          bool: {
            must: [
              QueryType.Match(Object.keys(value)[0], Object.values(value)[0])
            ]
          }
        } 
      }
    };
  }
}