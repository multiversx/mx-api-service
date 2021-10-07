import { ApiUtils } from "src/utils/api.utils";
import { AbstractQuery } from "./abstract.query"
import { ElasticPagination } from "./elastic.pagination"
import { ElasticSortProperty } from "./elastic.sort.property"
import { QueryCondition } from "./query.condition"
import { QueryConditionOptions } from "./query.condition.options";
import { RangeQuery } from "./range.query";
import { TermsQuery } from "./terms.query";

function buildElasticIndexerSort(sorts: ElasticSortProperty[]): any[] {
  if (!sorts) {
    return [];
  }

  return sorts.map((sortProp: ElasticSortProperty) => ({[sortProp.name]: { order: sortProp.order}}));
};

function getConditionOption(condition: QueryCondition): QueryConditionOptions {
  if (condition.should.length !== 0 && condition.must.length === 0) {
    return QueryConditionOptions.should;
  }

  return QueryConditionOptions.must;
}

export class ElasticQuery {
  pagination: ElasticPagination | undefined = undefined;
  sort: ElasticSortProperty[] = [];
  filter: AbstractQuery[] = [];
  condition: QueryCondition = new QueryCondition();
  terms?: TermsQuery;

  static create(): ElasticQuery {
    return new ElasticQuery();
  }
  
  withPagination(pagination: ElasticPagination): ElasticQuery {
    this.pagination = pagination;

    return this;
  }

  withSort(sort: ElasticSortProperty[]): ElasticQuery {
    this.sort = sort;

    return this;
  }

  withCondition(queryCondition: QueryConditionOptions, queries: AbstractQuery[]): ElasticQuery {
    this.condition[queryCondition] = queries;

    return this;
  }

  withTerms(termsQuery: TermsQuery): ElasticQuery {
    this.terms = termsQuery;

    return this;
  }

  withFilter(filter: RangeQuery[]): ElasticQuery {
    this.filter = filter;

    return this;
  }

  toJson() {
    const elasticSort = buildElasticIndexerSort(this.sort);
    const elasticCondition = getConditionOption(this.condition);
  
    const elasticQuery = {
      ...this.pagination,
      sort: elasticSort,
      query: {
        bool: {
          filter: this.filter.map(query => query.getQuery()),
          must: this.condition.must.map(query => query.getQuery()),
          should: this.condition.should.map(query => query.getQuery()),
          must_not: this.condition.must_not.map(query => query.getQuery()),
          minimum_should_match: elasticCondition === QueryConditionOptions.should ? 1 : undefined,
        },
        terms: this.terms?.getQuery(),
      }
    }
  
    ApiUtils.cleanupApiValueRecursively(elasticQuery);
  
    if (Object.keys(elasticQuery.query.bool).length === 0) {
      //@ts-ignore
      delete elasticQuery.query.bool;
  
      if (!this.terms) {
        //@ts-ignore
        elasticQuery.query['match_all'] = {}
      }
    }
    
    return elasticQuery;
  }
}