import { ElasticPagination } from "./elastic.pagination"
import { QueryCondition } from "./query.condition"

export class ElasticQuery {
  pagination: ElasticPagination | undefined = undefined
  sort: any
  filter: any
  condition: QueryCondition = QueryCondition.must
  queries: any
}