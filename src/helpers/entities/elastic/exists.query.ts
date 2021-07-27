import { AbstractQuery } from "./abstract.query";

export class ExistsQuery extends AbstractQuery {

  buildQuery(key: string): any {
    return { exists: key };
  }
}