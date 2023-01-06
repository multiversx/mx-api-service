import { AbstractQuery, AddressUtils, BinaryUtils, ElasticQuery, QueryConditionOptions, QueryOperator, QueryType, RangeGreaterThanOrEqual, RangeLowerThan, RangeLowerThanOrEqual } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { BlsService } from "src/endpoints/bls/bls.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { EsdtType } from "src/endpoints/esdt/entities/esdt.type";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

@Injectable()
export class ElasticIndexerHelper {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly blsService: BlsService,
  ) { }

  public async buildElasticBlocksFilter(filter: BlockFilter): Promise<AbstractQuery[]> {
    const { shard, proposer, validator, epoch, nonce } = filter;

    const queries: AbstractQuery[] = [];
    if (nonce !== undefined) {
      const nonceQuery = QueryType.Match("nonce", nonce);
      queries.push(nonceQuery);
    }
    if (shard !== undefined) {
      const shardIdQuery = QueryType.Match('shardId', shard);
      queries.push(shardIdQuery);
    }

    if (epoch !== undefined) {
      const epochQuery = QueryType.Match('epoch', epoch);
      queries.push(epochQuery);
    }

    if (proposer && shard !== undefined && epoch !== undefined) {
      const index = await this.blsService.getBlsIndex(proposer, shard, epoch);
      const proposerQuery = QueryType.Match('proposer', index);
      queries.push(proposerQuery);
    }

    if (validator && shard !== undefined && epoch !== undefined) {
      const index = await this.blsService.getBlsIndex(validator, shard, epoch);
      const validatorsQuery = QueryType.Match('validators', index);
      queries.push(validatorsQuery);
    }

    return queries;
  }

  public buildCollectionRolesFilter(filter: CollectionFilter, address?: string): ElasticQuery {
    let elasticQuery = ElasticQuery.create();
    elasticQuery = elasticQuery.withMustNotExistCondition('identifier')
      .withMustMultiShouldCondition([NftType.MetaESDT, NftType.NonFungibleESDT, NftType.SemiFungibleESDT], type => QueryType.Match('type', type));

    if (address) {
      if (this.apiConfigService.getIsIndexerV3FlagActive()) {
        elasticQuery = elasticQuery.withMustCondition(QueryType.Should(
          [
            QueryType.Match('currentOwner', address),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTCreate': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTBurn': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTAddQuantity': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTUpdateAttributes': address }),
            QueryType.Nested('roles', { 'roles.ESDTRoleNFTAddURI': address }),
            QueryType.Nested('roles', { 'roles.ESDTTransferRole': address }),
          ]
        ));
      } else {
        elasticQuery = elasticQuery.withMustCondition(QueryType.Match('currentOwner', address));
      }
    }

    if (filter.before || filter.after) {
      elasticQuery = elasticQuery.withDateRangeFilter('timestamp', filter.before, filter.after);
    }

    if (this.apiConfigService.getIsIndexerV3FlagActive()) {
      if (filter.canCreate !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTCreate', address, filter.canCreate);
      }

      if (filter.canBurn !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTBurn', address, filter.canBurn);
      }

      if (filter.canAddQuantity !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTAddQuantity', address, filter.canAddQuantity);
      }

      if (filter.canUpdateAttributes !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTUpdateAttributes', address, filter.canUpdateAttributes);
      }

      if (filter.canAddUri !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTAddURI', address, filter.canAddUri);
      }

      if (filter.canTransferRole !== undefined) {
        elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTTransferRole', address, filter.canTransferRole);
      }
    }

    if (filter.excludeMetaESDT === true) {
      elasticQuery = elasticQuery.withMustMultiShouldCondition([NftType.NonFungibleESDT, NftType.SemiFungibleESDT], type => QueryType.Match('type', type));
    }

    return elasticQuery.withMustMatchCondition('token', filter.collection, QueryOperator.AND)
      .withMustMultiShouldCondition(filter.identifiers, identifier => QueryType.Match('token', identifier, QueryOperator.AND))
      .withSearchWildcardCondition(filter.search, ['token', 'name'])
      .withMustMultiShouldCondition(filter.type, type => QueryType.Match('type', type))
      .withMustMultiShouldCondition([NftType.SemiFungibleESDT, NftType.NonFungibleESDT, NftType.MetaESDT], type => QueryType.Match('type', type));
  }

  private getRoleCondition(query: ElasticQuery, name: string, address: string | undefined, value: string | boolean) {
    const condition = value === false ? QueryConditionOptions.mustNot : QueryConditionOptions.must;
    const targetAddress = typeof value === 'string' ? value : address;

    return query.withCondition(condition, QueryType.Nested('roles', { [`roles.${name}`]: targetAddress }));
  }

  public buildElasticNftFilter(filter: NftFilter, identifier?: string, address?: string): ElasticQuery {
    let elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, QueryType.Exists('identifier'));

    if (address) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('address', address));
    }

    if (filter.search !== undefined) {
      elasticQuery = elasticQuery.withSearchWildcardCondition(filter.search, ['token', 'name']);
    }

    if (filter.type !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('type', filter.type));
    }

    if (identifier !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('identifier', identifier, QueryOperator.AND));
    }

    if (filter.collection !== undefined && filter.collection !== '') {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Match('token', filter.collection, QueryOperator.AND));
    }

    if (filter.collections !== undefined && filter.collections.length !== 0) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(filter.collections.map(collection => QueryType.Match('token', collection, QueryOperator.AND))));
    }

    if (filter.name !== undefined && filter.name !== '') {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested('data', { "data.name": filter.name }));
    }

    if (filter.hasUris !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested('data', { "data.nonEmptyURIs": filter.hasUris }));
    }

    if (filter.tags) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(filter.tags.map(tag => QueryType.Nested("data", { "data.tags": tag }))));
    }

    if (filter.creator !== undefined) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested("data", { "data.creator": filter.creator }));
    }

    if (filter.identifiers) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(filter.identifiers.map(identifier => QueryType.Match('identifier', identifier, QueryOperator.AND))));
    }

    if (filter.isWhitelistedStorage !== undefined && this.apiConfigService.getIsIndexerV3FlagActive()) {
      elasticQuery = elasticQuery.withMustCondition(QueryType.Nested("data", { "data.whiteListedStorage": filter.isWhitelistedStorage }));
    }

    if (filter.traits !== undefined) {
      for (const [key, value] of Object.entries(filter.traits)) {
        elasticQuery = elasticQuery.withMustMatchCondition('nft_traitValues', BinaryUtils.base64Encode(`${key}_${value}`));
      }
    }

    if (filter.isNsfw !== undefined) {
      const nsfwThreshold = this.apiConfigService.getNftExtendedAttributesNsfwThreshold();

      if (filter.isNsfw === true) {
        elasticQuery = elasticQuery.withRangeFilter('nft_nsfw_mark', new RangeGreaterThanOrEqual(nsfwThreshold));
      } else {
        elasticQuery = elasticQuery.withRangeFilter('nft_nsfw_mark', new RangeLowerThan(nsfwThreshold));
      }
    }

    if (filter.before || filter.after) {
      elasticQuery = elasticQuery.withDateRangeFilter('timestamp', filter.before, filter.after);
    }

    if (filter.nonceBefore) {
      elasticQuery = elasticQuery.withRangeFilter('nonce', new RangeLowerThanOrEqual(filter.nonceBefore));
    }

    if (filter.nonceAfter) {
      elasticQuery = elasticQuery.withRangeFilter('nonce', new RangeGreaterThanOrEqual(filter.nonceAfter));
    }

    if (filter.excludeMetaESDT === true) {
      elasticQuery = elasticQuery.withMustMultiShouldCondition([NftType.SemiFungibleESDT, NftType.NonFungibleESDT], type => QueryType.Match('type', type));
    }

    return elasticQuery;
  }

  public buildTransferFilterQuery(filter: TransactionFilter): ElasticQuery {
    let elasticQuery = ElasticQuery.create();

    if (filter.address) {
      const smartContractResultConditions = [
        QueryType.Match('receiver', filter.address),
        QueryType.Match('receivers', filter.address),
      ];

      if (AddressUtils.isSmartContractAddress(filter.address)) {
        smartContractResultConditions.push(QueryType.Match('sender', filter.address));
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
            QueryType.Match('sender', filter.address),
            QueryType.Match('receiver', filter.address),
            QueryType.Match('receivers', filter.address),
          ]),
        ]));
    }

    if (filter.type) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('type', filter.type === TransactionType.Transaction ? 'normal' : 'unsigned'));
    }

    if (filter.senders) {
      elasticQuery = elasticQuery.withMustMultiShouldCondition(filter.senders, sender => QueryType.Match('sender', sender));
    }

    if (filter.receivers) {
      const queries: AbstractQuery[] = [];
      for (const receiver of filter.receivers) {
        queries.push(QueryType.Match('receiver', receiver));
        queries.push(QueryType.Match('receivers', receiver));
      }

      elasticQuery = elasticQuery.withMustCondition(QueryType.Should(queries));
    }

    if (filter.token) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('tokens', filter.token, QueryOperator.AND));
    }

    if (filter.function && this.apiConfigService.getIsIndexerV3FlagActive()) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('function', filter.function));
    }

    if (filter.senderShard !== undefined) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('senderShard', filter.senderShard));
    }

    if (filter.receiverShard !== undefined) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('receiverShard', filter.receiverShard));
    }

    if (filter.miniBlockHash) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('miniBlockHash', filter.miniBlockHash));
    }

    if (filter.hashes) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Should(filter.hashes.map(hash => QueryType.Match('_id', hash))));
    }

    if (filter.status) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Match('status', filter.status));
    }

    if (filter.search) {
      elasticQuery = elasticQuery.withCondition(QueryConditionOptions.must, QueryType.Wildcard('data', `*${filter.search}*`));
    }

    if (filter.before || filter.after) {
      elasticQuery = elasticQuery.withDateRangeFilter('timestamp', filter.before, filter.after);
    }

    return elasticQuery;
  }

  public buildTokensWithRolesForAddressQuery(address: string, filter: TokenWithRolesFilter, pagination?: QueryPagination): ElasticQuery {
    const rolesConditions = [
      QueryType.Nested('roles', { 'roles.ESDTRoleLocalMint': address }),
      QueryType.Nested('roles', { 'roles.ESDTRoleLocalBurn': address }),
      QueryType.Nested('roles', { 'roles.ESDTTransferRole': address }),
    ];

    if (filter.includeMetaESDT === true) {
      rolesConditions.push(QueryType.Nested('roles', { 'roles.ESDTRoleNFTAddQuantity': address }));
      rolesConditions.push(QueryType.Nested('roles', { 'roles.ESDTRoleNFTAddURI': address }));
      rolesConditions.push(QueryType.Nested('roles', { 'roles.ESDTRoleNFTCreate': address }));
      rolesConditions.push(QueryType.Nested('roles', { 'roles.ESDTRoleNFTBurn': address }));
      rolesConditions.push(QueryType.Nested('roles', { 'roles.ESDTRoleNFTUpdateAttributes': address }));
    }

    let elasticQuery = ElasticQuery.create()
      .withMustNotExistCondition('identifier')
      .withMustCondition(QueryType.Should(
        [
          QueryType.Match('currentOwner', address),
          ...rolesConditions,
        ]
      ))
      .withMustMatchCondition('token', filter.identifier)
      .withMustMatchCondition('currentOwner', filter.owner);

    if (filter.includeMetaESDT === true) {
      elasticQuery = elasticQuery.withMustMultiShouldCondition([EsdtType.FungibleESDT, EsdtType.MetaESDT], type => QueryType.Match('type', type));
    } else {
      elasticQuery = elasticQuery.withMustMatchCondition('type', EsdtType.FungibleESDT);
    }

    if (filter.search) {
      elasticQuery = elasticQuery
        .withShouldCondition([
          QueryType.Wildcard('token', filter.search),
          QueryType.Wildcard('name', filter.search),
        ]);
    }

    if (filter.canMint !== undefined) {
      const condition = filter.canMint === true ? QueryConditionOptions.must : QueryConditionOptions.mustNot;
      elasticQuery = elasticQuery.withCondition(condition, QueryType.Nested('roles', { 'roles.ESDTRoleLocalMint': address }));
    }

    if (filter.canBurn !== undefined) {
      const condition = filter.canBurn === true ? QueryConditionOptions.must : QueryConditionOptions.mustNot;
      elasticQuery = elasticQuery.withCondition(condition, QueryType.Nested('roles', { 'roles.ESDTRoleLocalBurn': address }));
    }

    if (pagination) {
      elasticQuery = elasticQuery.withPagination(pagination);
    }

    return elasticQuery;
  }

  public async buildElasticRoundsFilter(filter: RoundFilter): Promise<AbstractQuery[]> {
    const queries: AbstractQuery[] = [];

    if (filter.shard !== undefined) {
      const shardIdQuery = QueryType.Match('shardId', filter.shard);
      queries.push(shardIdQuery);
    }

    if (filter.epoch !== undefined) {
      const epochQuery = QueryType.Match('epoch', filter.epoch);
      queries.push(epochQuery);
    }

    if (filter.validator !== undefined && filter.shard !== undefined && filter.epoch !== undefined) {
      const index = await this.blsService.getBlsIndex(filter.validator, filter.shard, filter.epoch);

      const signersIndexesQuery = QueryType.Match('signersIndexes', index);
      queries.push(signersIndexesQuery);
    }

    return queries;
  }

  public buildSmartContractResultFilterQuery(address?: string): ElasticQuery {
    const shouldQueries: AbstractQuery[] = [];
    const mustQueries: AbstractQuery[] = [];

    if (address) {
      shouldQueries.push(QueryType.Match('sender', address));
      shouldQueries.push(QueryType.Match('receiver', address));

      if (this.apiConfigService.getIsIndexerV3FlagActive()) {
        shouldQueries.push(QueryType.Match('receivers', address));
      }
    }

    const elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, shouldQueries)
      .withCondition(QueryConditionOptions.must, mustQueries);

    return elasticQuery;
  }

  public buildTransactionFilterQuery(filter: TransactionFilter, address?: string): ElasticQuery {
    let elasticQuery = ElasticQuery.create()
      .withMustMatchCondition('tokens', filter.token, QueryOperator.AND)
      .withMustMatchCondition('function', this.apiConfigService.getIsIndexerV3FlagActive() ? filter.function : undefined)
      .withMustMatchCondition('senderShard', filter.senderShard)
      .withMustMatchCondition('receiverShard', filter.receiverShard)
      .withMustMatchCondition('miniBlockHash', filter.miniBlockHash)
      .withMustMultiShouldCondition(filter.hashes, hash => QueryType.Match('_id', hash))
      .withMustMatchCondition('status', filter.status)
      .withMustWildcardCondition('data', filter.search)
      .withMustMultiShouldCondition(filter.tokens, token => QueryType.Match('tokens', token, QueryOperator.AND))
      .withDateRangeFilter('timestamp', filter.before, filter.after);

    if (filter.condition === QueryConditionOptions.should) {
      if (filter.sender) {
        elasticQuery = elasticQuery.withShouldCondition(QueryType.Match('sender', filter.sender));
      }

      if (filter.receivers) {
        const keys = ['receiver'];
        if (this.apiConfigService.getIsIndexerV3FlagActive()) {
          keys.push('receivers');
        }

        for (const receiver of filter.receivers) {
          for (const key of keys) {
            elasticQuery = elasticQuery.withShouldCondition(QueryType.Match(key, receiver));
          }
        }
      }
    } else {
      elasticQuery = elasticQuery.withMustMatchCondition('sender', filter.sender);

      if (filter.receivers) {
        const keys = ['receiver'];

        if (this.apiConfigService.getIsIndexerV3FlagActive()) {
          keys.push('receivers');
        }

        const queries: AbstractQuery[] = [];

        for (const receiver of filter.receivers) {
          for (const key of keys) {
            queries.push(QueryType.Match(key, receiver));
          }
        }

        elasticQuery = elasticQuery.withMustCondition(QueryType.Should(queries));
      }
    }

    if (address) {
      const keys: string[] = ['sender', 'receiver'];

      if (this.apiConfigService.getIsIndexerV3FlagActive()) {
        keys.push('receivers');
      }

      elasticQuery = elasticQuery.withMustMultiShouldCondition(keys, key => QueryType.Match(key, address));
    }

    return elasticQuery;
  }

  public buildAccountHistoryFilterQuery(address?: string, token?: string): ElasticQuery {
    const mustQueries: AbstractQuery[] = [];

    if (address) {
      mustQueries.push(QueryType.Match('address', address));
    }

    if (token) {
      mustQueries.push(QueryType.Match('token', token, QueryOperator.AND));
    }

    return ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, mustQueries);
  }
}
