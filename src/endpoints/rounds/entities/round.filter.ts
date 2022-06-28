import { QueryPagination } from "src/common/entities/query.pagination";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";

export class RoundFilter extends QueryPagination {
  constructor(init?: Partial<RoundFilter>) {
    super();
    Object.assign(this, init);
  }

  condition: QueryConditionOptions | undefined = QueryConditionOptions.must;
  validator: string | undefined;
  shard: number | undefined;
  epoch: number | undefined;
}
