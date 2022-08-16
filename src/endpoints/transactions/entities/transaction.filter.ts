import { AbstractQuery, ElasticQuery, QueryConditionOptions, QueryOperator, QueryType } from "@elrondnetwork/erdnest";
import { SortOrder } from "src/common/entities/sort.order";
import { TransactionStatus } from "./transaction.status";
import { TransactionType } from "./transaction.type";

export class TransactionFilter {
  constructor(init?: Partial<TransactionFilter>) {
    Object.assign(this, init);
  }

  address?: string;
  sender?: string;
  receivers?: string[] = [];
  token?: string;
  function?: string;
  senderShard?: number;
  receiverShard?: number;
  miniBlockHash?: string;
  hashes?: string[];
  status?: TransactionStatus;
  search?: string;
  before?: number;
  after?: number;
  condition?: QueryConditionOptions;
  order?: SortOrder;
  type?: TransactionType;
  tokens?: string[];

  buildElasticQuery(address?: string, indexerV3Active: boolean = false): ElasticQuery {
    let elasticQuery = ElasticQuery.create()
      .withMustMatchCondition('tokens', this.token, QueryOperator.AND)
      .withMustMatchCondition('function', indexerV3Active ? this.function : undefined)
      .withMustMatchCondition('senderShard', this.senderShard)
      .withMustMatchCondition('receiverShard', this.receiverShard)
      .withMustMatchCondition('miniBlockHash', this.miniBlockHash)
      .withMustMultiShouldCondition(this.hashes, hash => QueryType.Match('_id', hash))
      .withMustMatchCondition('status', this.status)
      .withMustWildcardCondition('data', this.search)
      .withMustMultiShouldCondition(this.tokens, token => QueryType.Match('tokens', token, QueryOperator.AND))
      .withDateRangeFilter('timestamp', this.before, this.after);

    if (this.condition === QueryConditionOptions.should) {
      if (this.sender) {
        elasticQuery = elasticQuery.withShouldCondition(QueryType.Match('sender', this.sender));
      }

      if (this.receivers) {
        const keys = ['receiver'];
        if (indexerV3Active) {
          keys.push('receivers');
        }

        for (const receiver of this.receivers) {
          for (const key of keys) {
            elasticQuery = elasticQuery.withShouldCondition(QueryType.Match(key, receiver));
          }
        }
      }
    } else {
      elasticQuery = elasticQuery.withMustMatchCondition('sender', this.sender);

      if (this.receivers) {
        const keys = ['receiver'];

        if (indexerV3Active) {
          keys.push('receivers');
        }

        const queries: AbstractQuery[] = [];

        for (const receiver of this.receivers) {
          for (const key of keys) {
            queries.push(QueryType.Match(key, receiver));
          }
        }

        elasticQuery = elasticQuery.withMustCondition(QueryType.Should(queries));
      }
    }

    if (address) {
      const keys: string[] = ['sender', 'receiver'];

      if (indexerV3Active) {
        keys.push('receivers');
      }

      elasticQuery = elasticQuery.withMustMultiShouldCondition(keys, key => QueryType.Match(key, address));
    }

    return elasticQuery;
  }
}
