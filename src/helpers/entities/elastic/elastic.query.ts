import { AbstractQuery } from "./abstract.query"
import { ElasticPagination } from "./elastic.pagination"
import { ElasticSortProperty } from "./elastic.sort.property"
import { QueryCondition } from "./query.condition"

export class ElasticQuery {
  pagination: ElasticPagination | undefined = undefined
  sort: ElasticSortProperty[] = []
  must: AbstractQuery[] = []
  should: AbstractQuery[] = []
  must_not: AbstractQuery[] = []
  filter: AbstractQuery[] = []
  condition: QueryCondition = QueryCondition.must
}