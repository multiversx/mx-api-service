import { QueryConditionOptions } from "@elrondnetwork/erdnest-common";
import { QueryPagination } from "src/common/entities/query.pagination";

export class RoundFilter extends QueryPagination {
  condition: QueryConditionOptions | undefined = QueryConditionOptions.must;
  validator: string | undefined;
  shard: number | undefined;
  epoch: number | undefined;
}
