import { AbstractQuery } from "./abstract.query";

export class QueryCondition {
  must: AbstractQuery[] = [];
  should: AbstractQuery[] = [];
  must_not: AbstractQuery[] = [];
}
