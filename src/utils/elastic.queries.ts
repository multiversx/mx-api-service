import { ElasticQuery } from "src/common/entities/elastic/elastic.query";
import { ElasticSortProperty } from "src/common/entities/elastic/elastic.sort.property";
import { QueryCondition } from "src/common/entities/elastic/query.condition";
import { QueryConditionOptions } from "src/common/entities/elastic/query.condition.options";
import { ApiUtils } from "src/utils/api.utils";

function buildElasticSort(sorts: ElasticSortProperty[]): any[] {
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

export function buildElasticQuery(query: ElasticQuery) {
  const elasticSort = buildElasticSort(query.sort);
  const elasticCondition = getConditionOption(query.condition);
  const terms = Object.keys(query.condition.terms).length > 0 ? query.condition.terms : undefined;

  const elasticQuery = {
    ...query.pagination,
    sort: elasticSort,
    query: {
      terms,
      bool: {
        filter: query.filter.map(query => query.getQuery()),
        must: query.condition.must.map(query => query.getQuery()),
        should: query.condition.should.map(query => query.getQuery()),
        must_not: query.condition.must_not.map(query => query.getQuery()),
        minimum_should_match: elasticCondition === QueryConditionOptions.should ? 1 : undefined,
      }
    }
  }

  ApiUtils.cleanupApiValueRecursively(elasticQuery);

  if (Object.keys(elasticQuery.query.bool).length === 0) {
    //@ts-ignore
    delete elasticQuery.query.bool;

    if (!terms) {
      //@ts-ignore
      elasticQuery.query['match_all'] = {};
    }
  }

  return elasticQuery;
}