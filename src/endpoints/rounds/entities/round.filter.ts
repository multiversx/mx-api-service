import { QueryPagination } from "src/common/entities/query.pagination";
import { QueryConditionOptions } from "src/helpers/entities/elastic/query.condition.options";

export class RoundFilter extends QueryPagination {
  condition: QueryConditionOptions | undefined = QueryConditionOptions.must;
  validator: string | undefined;
  shard: number | undefined;
  epoch: number | undefined;
}