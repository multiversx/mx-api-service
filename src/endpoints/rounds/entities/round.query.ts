import { QueryBase } from "src/common/entities/query.base";
import { QueryCondition } from "src/helpers/entities/query.condition";

export class RoundQuery extends QueryBase {
  condition: QueryCondition | undefined;
  validator: string | undefined;
  shard: number | undefined;
  epoch: number | undefined;
}