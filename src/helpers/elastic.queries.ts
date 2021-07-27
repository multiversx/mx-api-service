import { ElasticQuery } from "./entities/elastic/elastic.query";
import { ElasticSortProperty } from "./entities/elastic/elastic.sort.property";
import { QueryCondition } from "./entities/elastic/query.condition";
import { QueryConditionOptions } from "./entities/elastic/query.condition.options";
import { cleanupApiValueRecursively } from "./helpers";

function buildElasticSort(sorts: ElasticSortProperty[]): any[] {
  if (!sorts) {
    return [];
  }

  return sorts.map((sortProp: ElasticSortProperty) => ({[sortProp.name]: { order: sortProp.order}}))
};

function getConditionOption(condition: QueryCondition): QueryConditionOptions {
  if (condition.should.length !== 0 && condition.must.length === 0) {
    return QueryConditionOptions.should
  }

  return QueryConditionOptions.must;
}

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
  const elasticCondition = getConditionOption(query.condition);

  console.log(query);

  const elasticQuery = {
    ...elasticPagination,
    sort: elasticSort,
    query: {
      bool: {
        filter: [elasticFilter] ? elasticFilter: undefined,
        must: query.condition.must,
        should: query.condition.should,
        must_not: query.condition.must_not,
        minimum_should_match: elasticCondition === QueryConditionOptions.should ? 1 : undefined,
      }
    }
  }

  cleanupApiValueRecursively(elasticQuery);

  console.log(elasticQuery);

  if (Object.keys(elasticQuery.query.bool).length === 0) {
    //@ts-ignore
    delete elasticQuery.query.bool;

    //@ts-ignore
    elasticQuery.query['match_all'] = {}
  }
  
  return elasticQuery;
}