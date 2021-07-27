import { ElasticQuery } from "./entities/elastic/elastic.query";
import { ElasticSortProperty } from "./entities/elastic/elastic.sort.property";
import { QueryCondition } from "./entities/elastic/query.condition";
import { cleanupApiValueRecursively } from "./helpers";

function buildElasticSort(sorts: ElasticSortProperty[]): any[] {
  if (!sorts) {
    return [];
  }

  return sorts.map((sortProp: ElasticSortProperty) => ({[sortProp.name]: { order: sortProp.order}}))
};

export function extractFilterQuery(query: any): any {
  if (!query) {
    return false;
  }

  if (query['before'] || query['after']) {
    const { before, after } = query;

    delete query['before'];
    delete query['after'];

    return {
      before, after
    }
  }
}

export function buildElasticQuery(query: ElasticQuery) {
  const elasticPagination = query.pagination;
  const elasticSort = buildElasticSort(query.sort);
  const elasticFilter = query.filter;
  const elasticCondition = query.condition;

  const elasticQuery = {
    ...elasticPagination,
    sort: elasticSort,
    query: {
      bool: {
        filter: [elasticFilter] ? elasticFilter: undefined,
        must: query.must,
        should: query.should,
        must_not: query.must_not,
        minimum_should_match: elasticCondition === QueryCondition.should ? 1 : undefined,
      }
    }
  }

  cleanupApiValueRecursively(elasticQuery);

  if (Object.keys(elasticQuery.query.bool).length === 0) {
    //@ts-ignore
    delete elasticQuery.query.bool;

    //@ts-ignore
    elasticQuery.query['match_all'] = {}
  }
  
  return elasticQuery;
}