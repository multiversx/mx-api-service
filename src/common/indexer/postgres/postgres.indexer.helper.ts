import { AddressUtils, QueryConditionOptions } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { BlsService } from "src/endpoints/bls/bls.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";
import { Repository, SelectQueryBuilder } from "typeorm";
import { TokenType } from "../entities";
import { AccountHistoryDb, AccountsEsdtDb, BlockDb, RoundInfoDb, ScResultDb, ScResultOperationDb, TokenInfoDb, TransactionDb, TransactionOperationDb } from "./entities";

@Injectable()
export class PostgresIndexerHelper {
  constructor(
    private readonly blsService: BlsService,
    @InjectRepository(AccountHistoryDb)
    private readonly accountHistoryRepository: Repository<AccountHistoryDb>,
    @InjectRepository(RoundInfoDb)
    private readonly roundsRepository: Repository<RoundInfoDb>,
    @InjectRepository(ScResultDb)
    private readonly scResultsRepository: Repository<ScResultDb>,
    @InjectRepository(TokenInfoDb)
    private readonly tokensRepository: Repository<TokenInfoDb>,
    @InjectRepository(TransactionDb)
    private readonly transactionsRepository: Repository<TransactionDb>,
    @InjectRepository(TransactionOperationDb)
    private readonly operationsRepository: Repository<TransactionOperationDb>,
    @InjectRepository(BlockDb)
    private readonly blocksRepository: Repository<BlockDb>,
  ) { }

  public async buildElasticBlocksFilter(filter: BlockFilter): Promise<SelectQueryBuilder<BlockDb>> {
    let query = this.blocksRepository.createQueryBuilder();

    if (filter.nonce !== undefined) {
      query = query.andWhere('nonce = :nonce', { shard: filter.nonce });
    }

    if (filter.shard !== undefined) {
      query = query.andWhere('shard_id = :shard', { shard: filter.shard });
    }

    if (filter.epoch !== undefined) {
      query = query.andWhere('epoch = :epoch', { epoch: filter.epoch });
    }

    if (filter.proposer && filter.shard !== undefined && filter.epoch !== undefined) {
      const index = await this.blsService.getBlsIndex(filter.proposer, filter.shard, filter.epoch);
      query = query.andWhere('proposer = :index', { index });
    }

    if (filter.validator && filter.shard !== undefined && filter.epoch !== undefined) {
      const index = await this.blsService.getBlsIndex(filter.validator, filter.shard, filter.epoch);
      query = query.andWhere(`:index = ANY(REPLACE(REPLACE(validators, ']', '}'), '[', '{')::int[])`, { index });
    }

    return query;
  }

  buildCollectionRolesFilter(filter: CollectionFilter, address?: string): SelectQueryBuilder<TokenInfoDb> {
    let query = this.tokensRepository.createQueryBuilder()
      .where(`(identifier IS NULL OR identifier = '')`)
      .andWhere('type IN (:...types)', { types: [NftType.MetaESDT, NftType.NonFungibleESDT, NftType.SemiFungibleESDT] });

    if (address) {
      // TODO the "roles" column does not exist in "token_infos" table
      query = query.andWhere('current_owner = :address', { address });
      // elasticQuery = elasticQuery.withMustCondition(QueryType.Should(
      //   [
      //     QueryType.Match('currentOwner', address),
      //     QueryType.Nested('roles', { 'roles.ESDTRoleNFTCreate': address }),
      //     QueryType.Nested('roles', { 'roles.ESDTRoleNFTBurn': address }),
      //     QueryType.Nested('roles', { 'roles.ESDTRoleNFTAddQuantity': address }),
      //     QueryType.Nested('roles', { 'roles.ESDTRoleNFTUpdateAttributes': address }),
      //     QueryType.Nested('roles', { 'roles.ESDTRoleNFTAddURI': address }),
      //     QueryType.Nested('roles', { 'roles.ESDTTransferRole': address }),
      //   ]
      // ));
    }

    if (filter.before || filter.after) {
      query = query.andWhere('timestamp BETWEEN :before AND :after', { before: filter.before ?? 0, after: filter.after ?? Date.now() });
    }

    // if (filter.canCreate !== undefined) {
    //   elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTCreate', address, filter.canCreate);
    // }

    // if (filter.canBurn !== undefined) {
    //   elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTBurn', address, filter.canBurn);
    // }

    // if (filter.canAddQuantity !== undefined) {
    //   elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTAddQuantity', address, filter.canAddQuantity);
    // }

    // if (filter.canUpdateAttributes !== undefined) {
    //   elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTUpdateAttributes', address, filter.canUpdateAttributes);
    // }

    // if (filter.canAddUri !== undefined) {
    //   elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTRoleNFTAddURI', address, filter.canAddUri);
    // }

    // if (filter.canTransferRole !== undefined) {
    //   elasticQuery = this.getRoleCondition(elasticQuery, 'ESDTTransferRole', address, filter.canTransferRole);
    // }

    if (filter.collection !== undefined) {
      query = query.andWhere('token = :token', { token: filter.collection });
    }

    if (filter.identifiers !== undefined) {
      query = query.andWhere('identifier IN (:...identifiers)', { identifiers: filter.identifiers });
    }

    if (filter.search !== undefined) {
      query = query.andWhere('(token like :search OR name like :search)', { search: `%${filter.search}%` });
    }

    if (filter.type !== undefined) {
      query = query.andWhere('type IN (:...types)', { types: filter.type });
    }

    return query;
  }

  // private getRoleCondition(query: ElasticQuery, name: string, address: string | undefined, value: string | boolean) {
  //   // TODO the "roles" column does not exist in "token_infos" table
  //   const condition = value === false ? QueryConditionOptions.mustNot : QueryConditionOptions.must;
  //   const targetAddress = typeof value === 'string' ? value : address;

  //   return query.withCondition(condition, QueryType.Nested('roles', { [`roles.${name}`]: targetAddress }));
  // }

  buildElasticNftFilter(repository: Repository<AccountsEsdtDb | TokenInfoDb>, filter: NftFilter, identifier?: string, address?: string): SelectQueryBuilder<AccountsEsdtDb | TokenInfoDb> {
    let query = repository.createQueryBuilder()
      .where(`identifier IS NOT NULL AND identifier != ''`);

    if (address) {
      query = query.andWhere('address = :address', { address });
    }

    if (filter.search !== undefined) {
      query = query.andWhere('(token like :search OR name like :search)', { search: `%${filter.search}%` });
    }

    if (filter.type !== undefined) {
      query = query.andWhere('type IN (:...types)', { types: filter.type });
    }

    if (identifier !== undefined) {
      query = query.andWhere('identifier = :identifier', { identifier });
    }

    if (filter.collection !== undefined && filter.collection !== '') {
      query = query.andWhere('token = :token', { token: filter.collection });
    }

    if (filter.collections !== undefined && filter.collections.length !== 0) {
      query = query.andWhere('token IN (:...collections)', { collections: filter.collections });
    }

    // TODO could not find a relationship between the "token_infos" and "token_meta_data" tables
    // if (filter.name !== undefined && filter.name !== '') {
    //   query = query.withMustCondition(QueryType.Nested('data', { "data.name": filter.name }));
    // }

    // if (filter.hasUris !== undefined) {
    //   query = query.withMustCondition(QueryType.Nested('data', { "data.nonEmptyURIs": filter.hasUris }));
    // }

    // if (filter.tags) {
    //   query = query.withMustCondition(QueryType.Should(filter.tags.map(tag => QueryType.Nested("data", { "data.tags": tag }))));
    // }

    // if (filter.creator !== undefined) {
    //   query = query.withMustCondition(QueryType.Nested("data", { "data.creator": filter.creator }));
    // }

    if (filter.identifiers !== undefined) {
      query = query.andWhere('identifier IN (:...identifiers)', { identifiers: filter.identifiers });
    }

    // if (filter.isWhitelistedStorage !== undefined && this.apiConfigService.getIsIndexerV3FlagActive()) {
    //   query = query.withMustCondition(QueryType.Nested("data", { "data.whiteListedStorage": filter.isWhitelistedStorage }));
    // }

    // if (filter.isNsfw !== undefined) {
    //   const nsfwThreshold = this.apiConfigService.getNftExtendedAttributesNsfwThreshold();

    // if (filter.isNsfw === true) {
    //   elasticQuery = elasticQuery.withRangeFilter('nft_nsfw_mark', new RangeGreaterThanOrEqual(nsfwThreshold));
    // } else {
    //   elasticQuery = elasticQuery.withRangeFilter('nft_nsfw_mark', new RangeLowerThan(nsfwThreshold));
    // }

    if (filter.before || filter.after) {
      query = query.andWhere('timestamp BETWEEN :before AND :after', { before: filter.before ?? 0, after: filter.after ?? Date.now() });
    }

    return query;
  }

  buildTransferFilterQuery(filter: TransactionFilter): SelectQueryBuilder<TransactionOperationDb | ScResultOperationDb> {
    let query = this.operationsRepository.createQueryBuilder();

    if (filter.address) {
      const smartContractResultCondition = AddressUtils.isSmartContractAddress(filter.address)
        ? '(receiver = :receiver OR receivers like :receivers)'
        : '(sender = :sender OR receiver = :receiver OR receivers like :receivers)';  // receivers: `%${filter.receiver}%`,

      query = query.andWhere(
        `(((type = 'unsigned' AND ${smartContractResultCondition}) OR can_be_ignored IS NOT NULL) OR
          (type = 'normal' AND (sender = :sender OR receiver = :receiver OR receivers like :receivers)))`, {
        sender: filter.address,
        receiver: filter.address,
        receivers: `%${filter.address}%`,
      });
    }

    if (filter.type) {
      query = query.andWhere('type = :type', { type: filter.type === TransactionType.Transaction ? 'normal' : 'unsigned' });
    }

    if (filter.sender) {
      query = query.andWhere('sender = :sender', { sender: filter.sender });
    }

    if (filter.receivers) {
      query = query.andWhere('(receiver IN (:...receivers) OR receivers SIMILAR TO :similar)', {
        receivers: filter.receivers,
        similar: `%(${filter.receivers.join('|')})%`,
      });
    }

    if (filter.token) {
      query = query.andWhere('tokens like :token', { token: `%${filter.token}%` });
    }

    if (filter.function) {
      query = query.andWhere('function = :function', { function: filter.function });
    }

    if (filter.senderShard !== undefined) {
      query = query.andWhere('sender_shard = :shard', { shard: filter.senderShard });
    }

    if (filter.receiverShard !== undefined) {
      query = query.andWhere('receiver_shard = :shard', { shard: filter.receiverShard });
    }

    if (filter.miniBlockHash) {
      query = query.andWhere('mb_hash = :hash', { hash: filter.miniBlockHash });
    }

    if (filter.hashes) {
      query = query.andWhere('hash IN (:...hashes)', { hashes: filter.hashes });
    }

    if (filter.status) {
      query = query.andWhere('status = :status', { status: filter.status });
    }

    if (filter.search) {
      query = query.andWhere('data like :search', { search: `%${filter.search}%` });
    }

    if (filter.before || filter.after) {
      query = query.andWhere('timestamp BETWEEN :before AND :after', { before: filter.before ?? 0, after: filter.after ?? Date.now() });
    }

    return query;
  }

  buildTokensWithRolesForAddressQuery(_address: string, filter: TokenWithRolesFilter, pagination?: QueryPagination): SelectQueryBuilder<TokenInfoDb> {
    let query = this.tokensRepository.createQueryBuilder()
      .where(`identifier IS NOT NULL AND identifier != ''`)
      .andWhere('type = :type', { type: TokenType.FungibleESDT });

    // TODO the "roles" column does not exist in "token_infos" table
    // .withMustCondition(QueryType.Should(
    //   [
    //     QueryType.Match('currentOwner', address),
    //     QueryType.Nested('roles', { 'roles.ESDTRoleLocalMint': address }),
    //     QueryType.Nested('roles', { 'roles.ESDTRoleLocalBurn': address }),
    //   ]
    // ))

    if (filter.identifier) {
      query = query.andWhere('token = :token', { token: filter.identifier });
    }
    if (filter.owner) {
      query = query.andWhere('current_owner = :owner', { owner: filter.owner });
    }
    if (filter.search) {
      query = query.andWhere('(token like :search OR name like :search)', { search: `%${filter.search}%` });
    }

    if (filter.canMint !== undefined) {
      // TODO the "roles" column does not exist in "token_infos" table
      // const condition = filter.canMint === true ? QueryConditionOptions.must : QueryConditionOptions.mustNot;
      // elasticQuery = elasticQuery.withCondition(condition, QueryType.Nested('roles', { 'roles.ESDTRoleLocalMint': address }));
    }

    if (filter.canBurn !== undefined) {
      // TODO the "roles" column does not exist in "token_infos" table
      // const condition = filter.canBurn === true ? QueryConditionOptions.must : QueryConditionOptions.mustNot;
      // elasticQuery = elasticQuery.withCondition(condition, QueryType.Nested('roles', { 'roles.ESDTRoleLocalBurn': address }));
    }

    if (pagination) {
      query = query.skip(pagination.from).take(pagination.size);
    }

    return query;
  }


  async buildElasticRoundsFilter(filter: RoundFilter): Promise<SelectQueryBuilder<RoundInfoDb>> {
    let query = this.roundsRepository.createQueryBuilder();

    if (filter.shard !== undefined) {
      query = query.andWhere('shard_id = :shard', { shard: filter.shard });
    }

    if (filter.epoch !== undefined) {
      query = query.andWhere('epoch = :epoch', { epoch: filter.epoch });
    }

    if (filter.validator !== undefined && filter.shard !== undefined && filter.epoch !== undefined) {
      const index = await this.blsService.getBlsIndex(filter.validator, filter.shard, filter.epoch);
      query = query.andWhere(`:index = ANY(REPLACE(REPLACE(signers_indexes, ']', '}'), '[', '{')::int[])`, { index });
    }

    return query;
  }

  buildSmartContractResultFilterQuery(address?: string): SelectQueryBuilder<ScResultDb> {
    let query = this.scResultsRepository.createQueryBuilder();

    if (address) {
      query = query.where('sender = :address OR receiver = :address', { address });
    }

    return query;
  }

  buildTransactionFilterQuery(filter: TransactionFilter, address?: string): SelectQueryBuilder<TransactionDb> {
    let query = this.transactionsRepository.createQueryBuilder();

    if (filter.token !== undefined) {
      query = query.andWhere('tokens like :token', { token: `%${filter.token}%` });
    }
    if (filter.function !== undefined) {
      query = query.andWhere('function = :function', { function: filter.function });
    }
    if (filter.senderShard !== undefined) {
      query = query.andWhere('sender_shard = :shard', { shard: filter.senderShard });
    }
    if (filter.receiverShard !== undefined) {
      query = query.andWhere('receiver_shard = :shard', { shard: filter.receiverShard });
    }
    if (filter.miniBlockHash !== undefined) {
      query = query.andWhere('mb_hash = :hash', { hash: filter.miniBlockHash });
    }
    if (filter.status !== undefined) {
      query = query.andWhere('status = :status', { status: filter.status });
    }
    if (filter.search) {
      query = query.andWhere('data like :search', { search: `%${filter.search}%` });
    }
    if (filter.hashes) {
      query = query.andWhere('hash IN (:...hashes)', { hashes: filter.hashes });
    }

    if (filter.tokens !== undefined && filter.tokens.length !== 0) {
      let condition = '';
      for (const index in filter.tokens) {
        condition = `${condition} ${condition.length > 0 ? 'OR' : ''} (token like :token${index})`;
      }
      const params: any = {};
      for (const [token, index] of filter.tokens.entries()) {
        params[`token${index}`] = token;
      }

      query = query.andWhere(condition, params);
    }

    if (filter.before || filter.after) {
      query = query.andWhere('timestamp BETWEEN :before AND :after', { before: filter.before ?? 0, after: filter.after ?? Date.now() });
    }

    if (filter.condition === QueryConditionOptions.should) {
      if (filter.sender) {
        query = query.orWhere('sender = :sender', { sender: filter.sender });
      }

      if (filter.receivers) {
        query = query.andWhere('(receiver IN (:...receivers) OR receivers SIMILAR TO :similar)', {
          receivers: filter.receivers,
          similar: `%(${filter.receivers.join('|')})%`,
        });
      }
    } else {
      query = query.andWhere('sender = :sender', { sender: filter.sender });

      if (filter.receivers) {
        query = query.andWhere('(receiver IN (:...receivers) OR receivers SIMILAR TO :similar)', {
          receivers: filter.receivers,
          similar: `%(${filter.receivers.join('|')})%`,
        });
      }
    }

    if (address) {
      query = query.andWhere('(sender = :sender OR receiver = :receiver OR receivers like :receivers)', {
        sender: address,
        receiver: address,
        receivers: `%${address}%`,
      });
    }

    return query;
  }

  buildAccountHistoryFilterQuery(address?: string, token?: string): SelectQueryBuilder<AccountHistoryDb> {
    let query = this.accountHistoryRepository.createQueryBuilder();

    if (address) {
      query = query.andWhere('address = :address', { address });
    }

    if (token) {
      query = query.andWhere('token = :token', { token });
    }

    return query;
  }
}
