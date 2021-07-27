import { QueryPagination } from "src/common/entities/query.pagination";
import { QueryCondition } from "src/helpers/entities/elastic/query.condition";

export class RoundFilter extends QueryPagination {
  condition: QueryCondition | undefined;
  validator: string | undefined;
  shard: number | undefined;
  epoch: number | undefined;
}