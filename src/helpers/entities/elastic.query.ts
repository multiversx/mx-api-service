import { ElasticPagination } from "./elastic.pagination"
import { ElasticSortProperty } from "./elastic.sort.property"
import { QueryCondition } from "./query.condition"

export class ElasticQuery {
  pagination: ElasticPagination | undefined = undefined
  sort: ElasticSortProperty[] = []
  filter: any
  condition: QueryCondition = QueryCondition.must
  queries: any
}