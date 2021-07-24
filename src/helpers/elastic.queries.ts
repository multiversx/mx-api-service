import { ElasticPagination } from "./entities/elastic.pagination";
import { ElasticQuery } from "./entities/elastic.query";

export function buildElasticSort(sort: any): any {
  if (!sort) {
    return false
  }
  return { 
    sort: Object.keys(sort).map((key) => {
      const obj: any = {};

      obj[key] = {
        order: sort[key]
      };

      return obj;
    }),
  }
};

export function buildElasticPagination(pagination: ElasticPagination): {from: number, size: number} {
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

export function buildElasticFilter(filter: any): any {
  if (!filter) {
    return false;
  }

  if (filter['before'] || filter['after']) {
    const range = buildElasticRange(filter);
    return {
      filter: {
        range
      }
    }
  }
}

export function buildElasticQuery(query: ElasticQuery) {
  const elasticPagination = buildElasticPagination(query.pagination);
  const elasticSort = buildElasticSort(query.sort);
  const elasticFilter = buildElasticFilter(query.filter);

  return {
    ...elasticPagination,
    ...elasticSort,
    query: {
      bool: {
        filter: elasticFilter ? elasticFilter : undefined
      }
    }
  }
}