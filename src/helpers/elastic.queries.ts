import { ElasticPagination } from "./entities/elastic/elastic.pagination";
import { ElasticQuery } from "./entities/elastic/elastic.query";
import { ElasticSortProperty } from "./entities/elastic/elastic.sort.property";
import { MatchQuery } from "./entities/elastic/match.query";
import { QueryCondition } from "./entities/elastic/query.condition";
import { cleanupApiValueRecursively } from "./helpers";

function buildElasticSort(sorts: ElasticSortProperty[]): any[] {
  if (!sorts) {
    return [];
  }

  return sorts.map((sortProp: ElasticSortProperty) => ({[sortProp.name]: { order: sortProp.order}}))
};

function buildElasticPagination(pagination: ElasticPagination | undefined): {from: number, size: number} | undefined {
  if (!pagination) {
    return undefined;
  }

  return {
    from: pagination.from,
    size: pagination.size,
  }
}

function buildElasticRange(range: any = {}) {
  let obj: any = {};
  obj['timestamp'] = {};
  Object.keys(range).map((key) => {
    if (key == 'before' && range[key] != undefined) {
      obj['timestamp']['lte'] = range[key];
    }
    if (key == 'after' && range[key] != undefined) {
      obj['timestamp']['gte'] = range[key];
    }
  });
  return obj;
};

function buildElasticFilter(filter: any): any {
  if (!filter) {
    return undefined;
  }

  if (filter['before'] || filter['after']) {
    const range = buildElasticRange(filter);

    return {
      range
    }
  }
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

function buildElasticQueries(queries: any) {
  if (Object.keys(queries).length) {
    return Object.keys(queries)
      .filter(key => queries[key] !== null && queries[key] !== undefined)
      .map((key) => new MatchQuery(key, queries[key], undefined).getQuery());
  }

  return null;
}

export function buildElasticQuery(query: ElasticQuery) {
  const elasticPagination = buildElasticPagination(query.pagination);
  const elasticSort = buildElasticSort(query.sort);
  const elasticFilter = buildElasticFilter(query.filter);
  const elasticCondition = query.condition;
  const elasticQueries = buildElasticQueries(query.queries);

  const elasticQuery = {
    ...elasticPagination,
    sort: elasticSort,
    query: {
      bool: {
        filter: [elasticFilter] ? elasticFilter: undefined,
        must: elasticCondition === QueryCondition.must ? elasticQueries : undefined,
        should: elasticCondition === QueryCondition.should ? elasticQueries : undefined,
        must_not: elasticCondition === QueryCondition.mustNot ? elasticQueries : undefined,
        minimum_should_match: elasticCondition === QueryCondition.should ? 1 : undefined,
      }
    }
  }

  cleanupApiValueRecursively(elasticQuery);

  console.log({elasticQuery});
  console.log({elasticQueries});

  if (Object.keys(elasticQuery.query.bool).length === 0) {
    //@ts-ignore
    delete elasticQuery.query.bool;

    //@ts-ignore
    elasticQuery.query['match_all'] = {}
  }
  
  return elasticQuery;
}