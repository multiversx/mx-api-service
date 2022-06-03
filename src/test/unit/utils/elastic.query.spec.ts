import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryType } from "src/common/elastic/entities/query.type";
import { RangeQuery } from "src/common/elastic/entities/range.query";
import { TermsQuery } from "src/common/elastic/entities/terms.query";

describe('Elastic Query', () => {
  describe('Create Elastic Query', () => {
    const elasticQuery: ElasticQuery = ElasticQuery.create();

    it('Should return undefined pagination', () => {
      expect(elasticQuery.pagination).toBeUndefined();
    });

    it('Should return empty sort array', () => {
      expect(elasticQuery.sort.length).toEqual(0);
    });

    it('Should return empty filter array', () => {
      expect(elasticQuery.filter.length).toEqual(0);
    });

    it('Should return empty conditions', () => {
      expect(elasticQuery.condition.should.length).toEqual(0);
      expect(elasticQuery.condition.must.length).toEqual(0);
      expect(elasticQuery.condition.must_not.length).toEqual(0);
    });

    it('Should return undefined terms', () => {
      expect(elasticQuery.terms).toBeUndefined();
    });

    it('Should return an match_all query', () => {
      expect(elasticQuery.toJson()).toMatchObject({ query: { match_all: {} } });
    });
  });

  describe('Add pagination to elastic query', () => {
    const elasticQuery: ElasticQuery = ElasticQuery.create();

    elasticQuery.withPagination({ from: 0, size: 1 });
    expect(elasticQuery.pagination?.from).toEqual(0);
    expect(elasticQuery.pagination?.size).toEqual(1);

    expect(elasticQuery.toJson().from).toEqual(0);
    expect(elasticQuery.toJson().size).toEqual(1);
    expect(elasticQuery.toJson().query).toMatchObject({ match_all: {} });

    elasticQuery.withPagination({ from: 10, size: 100 });
    expect(elasticQuery.pagination?.from).toEqual(10);
    expect(elasticQuery.pagination?.size).toEqual(100);

    expect(elasticQuery.toJson().from).toEqual(10);
    expect(elasticQuery.toJson().size).toEqual(100);
    expect(elasticQuery.toJson().query).toMatchObject({ match_all: {} });
  });


  describe('Add sort to elastic query', () => {
    const elasticQuery: ElasticQuery = ElasticQuery.create();

    elasticQuery.withSort([{ name: 'test', order: ElasticSortOrder.descending }]);
    expect(elasticQuery.sort.length).toEqual(1);

    expect(elasticQuery.toJson().sort.toString()).toStrictEqual([{ name: 'test', order: ElasticSortOrder.descending }].toString());
  });

  describe('Add condition to elastic query', () => {
    const elasticQuery: ElasticQuery = ElasticQuery.create();

    elasticQuery.withCondition(QueryConditionOptions.mustNot, [QueryType.Match('test', { test: 'test' })]);
    expect(elasticQuery.condition.must_not.length).toEqual(1);
    expect(elasticQuery.condition.must_not[0].getQuery()).toMatchObject({ match: { test: { test: 'test' } } });

    expect(elasticQuery.toJson().query.bool.must_not).toBeDefined();
  });

  describe('Add range filter to elastic query', () => {
    const elasticQuery1: ElasticQuery = ElasticQuery.create();

    elasticQuery1.withFilter(new RangeQuery('test', 100, undefined));
    expect(elasticQuery1.filter.length).toEqual(1);
    expect(elasticQuery1.filter[0].getQuery()).toMatchObject({ range: { test: { lte: 100 } } });

    const elasticQuery2 = ElasticQuery.create();
    elasticQuery2.withFilter(new RangeQuery('test', 100, 1));
    expect(elasticQuery2.filter.length).toEqual(1);
    expect(elasticQuery2.filter[0].getQuery()).toMatchObject({ range: { test: { lte: 100, gte: 1 } } });

    expect(elasticQuery2.toJson().query.bool.filter).toBeDefined();
  });

  describe('Add terms to elastic query', () => {
    const elasticQuery: ElasticQuery = ElasticQuery.create();

    elasticQuery.withTerms(new TermsQuery('test', ['a', 'b', 'c']));
    expect(elasticQuery.terms).toBeDefined();

    expect(elasticQuery.toJson().query.terms).toBeDefined();
  });
});
