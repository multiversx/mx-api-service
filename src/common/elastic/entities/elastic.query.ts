import { ApiUtils } from "src/utils/api.utils";
import { AbstractQuery } from "./abstract.query";
import { ElasticPagination } from "./elastic.pagination";
import { ElasticSortProperty } from "./elastic.sort.property";
import { MatchQuery } from "./match.query";
import { QueryCondition } from "./query.condition";
import { QueryConditionOptions } from "./query.condition.options";
import { QueryOperator } from "./query.operator";
import { QueryType } from "./query.type";
import { RangeQuery } from "./range.query";
import { TermsQuery } from "./terms.query";

function buildElasticIndexerSort(sorts: ElasticSortProperty[]): any[] {
  if (!sorts) {
    return [];
  }

  return sorts.map((sortProp: ElasticSortProperty) => ({ [sortProp.name]: { order: sortProp.order } }));
}

export class ElasticQuery {
  pagination?: ElasticPagination;
  sort: ElasticSortProperty[] = [];
  filter: AbstractQuery[] = [];
  condition: QueryCondition = new QueryCondition();
  terms?: TermsQuery;
  extra?: Record<string, any>;

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

  withMustMatchCondition(key: string, value: any | undefined, operator: QueryOperator | undefined = undefined) {
    if (value === undefined) {
      return this;
    }

    return this.withMustCondition(QueryType.Match(key, value, operator));
  }

  withMustWildcardCondition(key: string, value: string | undefined) {
    if (value === undefined) {
      return this;
    }

    return this.withMustCondition(QueryType.Wildcard(key, `*${value}*`));
  }

  withMustMultiShouldCondition<T>(values: T[] | undefined, action: (value: T) => MatchQuery) {
    if (values === undefined) {
      return this;
    }

    return this.withMustCondition(QueryType.Should(values.map(value => action(value))));
  }

  withMustExistCondition(key: string): ElasticQuery {
    return this.withMustCondition(QueryType.Exists(key));
  }

  withMustNotExistCondition(key: string): ElasticQuery {
    return this.withMustNotCondition(QueryType.Exists(key));
  }

  withMustCondition(queries: AbstractQuery[] | AbstractQuery): ElasticQuery {
    return this.withCondition(QueryConditionOptions.must, queries);
  }

  withMustNotCondition(queries: AbstractQuery[] | AbstractQuery): ElasticQuery {
    return this.withCondition(QueryConditionOptions.mustNot, queries);
  }

  withShouldCondition(queries: AbstractQuery[] | AbstractQuery): ElasticQuery {
    return this.withCondition(QueryConditionOptions.should, queries);
  }

  withSearchWildcardCondition(search: string | undefined, keys: string[]): ElasticQuery {
    return this.withSearchCondition(search, term => keys.map(key => QueryType.Wildcard(key, `*${term.toLowerCase()}*`)));
  }

  withSearchCondition(search: string | undefined, func: (term: string) => AbstractQuery[]): ElasticQuery {
    if (!search) {
      return this;
    }

    const searchConditions = [];

    const components = search.matchAll(/\w{3,}/g);
    for (const component of components) {
      const term = component[0];

      const conditions = func(term);

      searchConditions.push(QueryType.Should(conditions));
    }

    return this.withMustCondition(searchConditions);
  }

  withCondition(queryCondition: QueryConditionOptions, queries: AbstractQuery[] | AbstractQuery): ElasticQuery {
    if (!Array.isArray(queries)) {
      queries = [queries];
    }

    if (!this.condition[queryCondition]) {
      this.condition[queryCondition] = [];
    }

    this.condition[queryCondition].push(...queries);

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

  withExtra(extra: Record<string, any>): ElasticQuery {
    this.extra = extra;

    return this;
  }

  toJson() {
    const elasticSort = buildElasticIndexerSort(this.sort);

    const elasticQuery = {
      ...this.pagination,
      sort: elasticSort,
      query: {
        bool: {
          filter: this.filter.map(query => query.getQuery()),
          must: this.condition.must.map(query => query.getQuery()),
          should: this.condition.should.map(query => query.getQuery()),
          must_not: this.condition.must_not.map(query => query.getQuery()),
          minimum_should_match: this.condition.should.length !== 0 ? 1 : undefined,
        },
        terms: this.terms?.getQuery(),
      },
      ...this.extra ?? {},
    };

    ApiUtils.cleanupApiValueRecursively(elasticQuery);

    if (Object.keys(elasticQuery.query.bool).length === 0) {
      //@ts-ignore
      delete elasticQuery.query.bool;

      if (!this.terms) {
        //@ts-ignore
        elasticQuery.query['match_all'] = {};
      }
    }

    return elasticQuery;
  }
}
