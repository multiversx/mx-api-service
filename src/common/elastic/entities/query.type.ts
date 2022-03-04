import { AbstractQuery } from "./abstract.query";
import { ExistsQuery } from "./exists.query";
import { MatchQuery } from "./match.query";
import { MustQuery } from "./must.query";
import { NestedQuery } from "./nested.query";
import { QueryOperator } from "./query.operator";
import { RangeQuery } from "./range.query";
import { ShouldQuery } from "./should.query";
import { WildcardQuery } from "./wildcard.query";

export class QueryType {
  static Match = (key: string, value: any | undefined, operator: QueryOperator | undefined = undefined): MatchQuery => {
    return new MatchQuery(key, value, operator);
  };

  static Exists = (key: string): ExistsQuery => {
    return new ExistsQuery(key);
  };

  static Range = (key: string, before: number, after: number): RangeQuery => {
    return new RangeQuery(key, before, after);
  };

  static Wildcard = (key: string, value: string): WildcardQuery => {
    return new WildcardQuery(key, value);
  };

  static Nested = (key: string, value: any | undefined): NestedQuery => {
    return new NestedQuery(key, value);
  };

  static Should = (queries: AbstractQuery[]): ShouldQuery => {
    return new ShouldQuery(queries);
  };

  static Must = (queries: AbstractQuery[], mustNotQueries: AbstractQuery[] = []): MustQuery => {
    return new MustQuery(queries, mustNotQueries);
  };
}
