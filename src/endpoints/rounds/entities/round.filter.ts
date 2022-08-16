import { AbstractQuery, ElasticQuery, QueryConditionOptions, QueryType } from "@elrondnetwork/erdnest";
import { QueryPagination } from "src/common/entities/query.pagination";

export class RoundFilter extends QueryPagination {
  constructor(init?: Partial<RoundFilter>) {
    super();
    Object.assign(this, init);
  }

  condition: QueryConditionOptions | undefined = QueryConditionOptions.must;
  validator: string | undefined;
  shard: number | undefined;
  epoch: number | undefined;

  buildElasticQuery(blsIndex?: number): ElasticQuery {
    const queries: AbstractQuery[] = [];

    if (this.shard !== undefined) {
      const shardIdQuery = QueryType.Match('shardId', this.shard);
      queries.push(shardIdQuery);
    }

    if (this.epoch !== undefined) {
      const epochQuery = QueryType.Match('epoch', this.epoch);
      queries.push(epochQuery);
    }

    if (blsIndex !== undefined) {
      const signersIndexesQuery = QueryType.Match('signersIndexes', blsIndex);
      queries.push(signersIndexesQuery);
    }

    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(this.condition ?? QueryConditionOptions.must, queries);

    return elasticQuery;
  }
}
