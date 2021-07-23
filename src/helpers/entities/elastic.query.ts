import { ElasticPagination } from "./elastic.pagination"
import { QueryCondition } from "./query.condition"

export class ElasticQuery {
  pagination: ElasticPagination = new ElasticPagination()
  sort: any
  filter: any
  condition: QueryCondition = QueryCondition.must
}