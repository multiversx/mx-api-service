import { AbstractQuery, ElasticQuery, QueryConditionOptions, QueryType } from "@elrondnetwork/erdnest";

export class BlockFilter {
  constructor(init?: Partial<BlockFilter>) {
    Object.assign(this, init);
  }

  shard?: number;
  proposer?: string;
  validator?: string;
  epoch?: number;
  nonce?: number;

  buildElasticQuery(proposerIndex?: number, validatorIndex?: number): ElasticQuery {
    const queries: AbstractQuery[] = [];
    if (this.nonce !== undefined) {
      const nonceQuery = QueryType.Match("nonce", this.nonce);
      queries.push(nonceQuery);
    }
    if (this.shard !== undefined) {
      const shardIdQuery = QueryType.Match('shardId', this.shard);
      queries.push(shardIdQuery);
    }

    if (this.epoch !== undefined) {
      const epochQuery = QueryType.Match('epoch', this.epoch);
      queries.push(epochQuery);
    }

    if (proposerIndex !== undefined) {
      const proposerQuery = QueryType.Match('proposer', proposerIndex);
      queries.push(proposerQuery);
    }

    if (validatorIndex !== undefined) {
      const validatorsQuery = QueryType.Match('validators', validatorIndex);
      queries.push(validatorsQuery);
    }

    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, queries);

    return elasticQuery;
  }
}
