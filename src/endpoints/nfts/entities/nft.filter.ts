import { ElasticQuery, QueryConditionOptions, QueryOperator, QueryType, RangeGreaterThanOrEqual, RangeLowerThan } from "@elrondnetwork/erdnest";
import { NftType } from "./nft.type";

export class NftFilter {
  constructor(init?: Partial<NftFilter>) {
    Object.assign(this, init);
  }

  search?: string;
  identifiers?: string[];
  type?: NftType;
  collection?: string;
  collections?: string[];
  tags?: string[];
  name?: string;
  creator?: string;
  hasUris?: boolean;
  includeFlagged?: boolean;
  before?: number;
  after?: number;
  isWhitelistedStorage?: boolean;
  isNsfw?: boolean;

  buildElasticQuery(nsfwThreshold: number, identifier?: string, address?: string, indexerV3Active: boolean = false): ElasticQuery {
    let elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, QueryType.Exists('identifier'));

    if (address) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('address', address));
    }

    if (this.search !== undefined) {
      elasticQuery = elasticQuery.withSearchWildcardCondition(this.search, ['token', 'name']);
    }

    if (this.type !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('type', this.type));
    }

    if (identifier !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('identifier', identifier, QueryOperator.AND));
    }

    if (this.collection !== undefined && this.collection !== '') {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('token', this.collection, QueryOperator.AND));
    }

    if (this.collections !== undefined && this.collections.length !== 0) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(this.collections.map(collection => QueryType.Match('token', collection, QueryOperator.AND))));
    }

    if (this.name !== undefined && this.name !== '') {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested('data', { "data.name": this.name }));
    }

    if (this.hasUris !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested('data', { "data.nonEmptyURIs": this.hasUris }));
    }

    if (this.tags) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(this.tags.map(tag => QueryType.Nested("data", { "data.tags": tag }))));
    }

    if (this.creator !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested("data", { "data.creator": this.creator }));
    }

    if (this.identifiers) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(this.identifiers.map(identifier => QueryType.Match('identifier', identifier, QueryOperator.AND))));
    }

    if (this.isWhitelistedStorage !== undefined && indexerV3Active) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested("data", { "data.whiteListedStorage": this.isWhitelistedStorage }));
    }

    if (this.isNsfw !== undefined) {
      if (this.isNsfw === true) {
        elasticQuery = elasticQuery.withRangeFilter('nft_nsfw_mark', new RangeGreaterThanOrEqual(nsfwThreshold));
      } else {
        elasticQuery = elasticQuery.withRangeFilter('nft_nsfw_mark', new RangeLowerThan(nsfwThreshold));
      }
    }

    if (this.before || this.after) {
      elasticQuery = elasticQuery.withDateRangeFilter('timestamp', this.before, this.after);
    }

    return elasticQuery;
  }
}
