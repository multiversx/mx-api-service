import { AbstractQuery, AddressUtils, ElasticQuery, QueryConditionOptions, QueryOperator, QueryType } from "@elrondnetwork/erdnest";
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

  buildElasticTransfersQuery(indexerV3Active: boolean = false): ElasticQuery {
    let elasticQuery = ElasticQuery.create();

    if (this.address) {
      const smartContractResultConditions = [
        QueryType.Match('receiver', this.address),
        QueryType.Match('receivers', this.address),
      ];

      if (AddressUtils.isSmartContractAddress(this.address)) {
        smartContractResultConditions.push(QueryType.Match('sender', this.address));
      }

      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.should, QueryType.Must([
        QueryType.Match('type', 'unsigned'),
        QueryType.Should(smartContractResultConditions),
      ], [
        QueryType.Exists('canBeIgnored'),
      ]))
        .withCondition(QueryConditionOptions.should, QueryType.Must([
          QueryType.Match('type', 'normal'),
          QueryType.Should([
            QueryType.Match('sender', this.address),
            QueryType.Match('receiver', this.address),
            QueryType.Match('receivers', this.address),
          ]),
        ]));
    }

    if (this.type) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('type', this.type === TransactionType.Transaction ? 'normal' : 'unsigned'));
    }

    if (this.sender) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('sender', this.sender));
    }

    if (this.receivers) {
      const queries: AbstractQuery[] = [];
      for (const receiver of this.receivers) {
        queries.push(QueryType.Match('receiver', receiver));
        queries.push(QueryType.Match('receivers', receiver));
      }

      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(queries));
    }

    if (this.token) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('tokens', this.token, QueryOperator.AND));
    }

    if (this.function && indexerV3Active) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('function', this.function));
    }

    if (this.senderShard !== undefined) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('senderShard', this.senderShard));
    }

    if (this.receiverShard !== undefined) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('receiverShard', this.receiverShard));
    }

    if (this.miniBlockHash) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('miniBlockHash', this.miniBlockHash));
    }

    if (this.hashes) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Should(this.hashes.map(hash => QueryType.Match('_id', hash))));
    }

    if (this.status) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('status', this.status));
    }

    if (this.search) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Wildcard('data', `*${this.search}*`));
    }

    if (this.before || this.after) {
      elasticQuery = elasticQuery.withDateRangeFilter('timestamp', this.before, this.after);
    }

    return elasticQuery;
  }
}
