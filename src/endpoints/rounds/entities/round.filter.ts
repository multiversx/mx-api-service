import { QueryConditionOptions } from "@elrondnetwork/nestjs-microservice-common";
import { QueryPagination } from "src/common/entities/query.pagination";

export class RoundFilter extends QueryPagination {
  condition: QueryConditionOptions | undefined = QueryConditionOptions.must;
  validator: string | undefined;
  shard: number | undefined;
  epoch: number | undefined;
}
