import { AbstractQuery } from "src/common/entities/elastic/abstract.query";
import { ElasticQuery } from "src/common/entities/elastic/elastic.query";
import { ElasticSortProperty } from "src/common/entities/elastic/elastic.sort.property";
import { QueryCondition } from "src/common/entities/elastic/query.condition";
import { QueryConditionOptions } from "src/common/entities/elastic/query.condition.options";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ApiUtils } from "./api.utils";

export class ElasticUtils {
  static boilerplate(condition: QueryConditionOptions, queries: AbstractQuery[], pagination?: QueryPagination, sort?: ElasticSortProperty[]) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    if (pagination) {
      elasticQueryAdapter.pagination = pagination;
    }
    if (sort) {
      elasticQueryAdapter.sort = sort;
    }
    elasticQueryAdapter.condition[condition] = queries;

    return elasticQueryAdapter;
  };

  static buildElasticQuery(query: ElasticQuery) {
    const elasticSort = ElasticUtils.buildElasticSort(query.sort);
    const elasticCondition = ElasticUtils.getConditionOption(query.condition);
  
    const elasticQuery = {
      ...query.pagination,
      sort: elasticSort,
      query: {
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
  
      //@ts-ignore
      elasticQuery.query['match_all'] = {}
    }
    
    return elasticQuery;
  }

  static buildElasticSort(sorts: ElasticSortProperty[]): any[] {
    if (!sorts) {
      return [];
    }
  
    return sorts.map((sortProp: ElasticSortProperty) => ({[sortProp.name]: { order: sortProp.order}}));
  };
  
  static getConditionOption(condition: QueryCondition): QueryConditionOptions {
    if (condition.should.length !== 0 && condition.must.length === 0) {
      return QueryConditionOptions.should;
    }
  
    return QueryConditionOptions.must;
  }
}