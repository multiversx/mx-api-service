import { BinaryUtils } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryPagination } from "src/common/entities/query.pagination";
import { SortOrder } from "src/common/entities/sort.order";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { Repository } from "typeorm";
import { MiniBlock, Tag, TokenType } from "../entities";
import { IndexerInterface } from "../indexer.interface";
import { AccountDb, AccountsEsdtDb, BlockDb, LogDb, MiniBlockDb, ReceiptDb, RoundInfoDb, ScDeployInfoDb, ScResultDb, TagDb, TokenInfoDb, TransactionDb, ValidatorPublicKeysDb } from "./entities";
import { PostgresIndexerHelper } from "./postgres.indexer.helper";

@Injectable()
export class PostgresIndexerService implements IndexerInterface {
  constructor(
    @InjectRepository(AccountDb)
    private readonly accountsRepository: Repository<AccountDb>,
    @InjectRepository(AccountsEsdtDb)
    private readonly accountsEsdtRepository: Repository<AccountsEsdtDb>,
    @InjectRepository(ScResultDb)
    private readonly scResultsRepository: Repository<ScResultDb>,
    @InjectRepository(RoundInfoDb)
    private readonly roundsRepository: Repository<RoundInfoDb>,
    @InjectRepository(TokenInfoDb)
    private readonly tokensRepository: Repository<TokenInfoDb>,
    @InjectRepository(BlockDb)
    private readonly blocksRepository: Repository<BlockDb>,
    @InjectRepository(TransactionDb)
    private readonly transactionsRepository: Repository<TransactionDb>,
    @InjectRepository(ScDeployInfoDb)
    private readonly scDeploysRepository: Repository<ScDeployInfoDb>,
    @InjectRepository(MiniBlockDb)
    private readonly miniBlocksRepository: Repository<MiniBlockDb>,
    @InjectRepository(TagDb)
    private readonly tagsRepository: Repository<TagDb>,
    @InjectRepository(ReceiptDb)
    private readonly receiptsRepository: Repository<ReceiptDb>,
    @InjectRepository(LogDb)
    private readonly logsRepository: Repository<LogDb>,
    @InjectRepository(ValidatorPublicKeysDb)
    private readonly validatorPublicKeysRepository: Repository<ValidatorPublicKeysDb>,
    private readonly indexerHelper: PostgresIndexerHelper,
  ) { }

  async getAccountsCount(): Promise<number> {
    return await this.accountsRepository.count();
  }

  async getScResultsCount(): Promise<number> {
    return await this.scResultsRepository.count();
  }

  async getAccountContractsCount(address: string): Promise<number> {
    const query = this.scDeploysRepository
      .createQueryBuilder()
      .where('creator = :address', { address });

    return await query.getCount();
  }

  async getBlocksCount(filter: BlockFilter): Promise<number> {
    const query = await this.indexerHelper.buildElasticBlocksFilter(filter);
    return await query.getCount();
  }

  async getBlocks(filter: BlockFilter, { from, size }: QueryPagination): Promise<any[]> {
    let query = await this.indexerHelper.buildElasticBlocksFilter(filter);
    query = query
      .skip(from).take(size)
      .orderBy('timestamp', 'DESC')
      .addOrderBy('shard_id', 'ASC');

    const result = await query.getMany();
    return result;
  }

  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    const query = this.indexerHelper.buildCollectionRolesFilter(filter);
    return await query.getCount();
  }

  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    const query = this.indexerHelper.buildElasticNftFilter(this.accountsEsdtRepository, filter, undefined, address);
    return await query.getCount();
  }

  async getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number> {
    const query = this.indexerHelper.buildCollectionRolesFilter(filter, address);
    return await query.getCount();
  }

  async getNftCount(filter: NftFilter): Promise<number> {
    const query = this.indexerHelper.buildElasticNftFilter(this.tokensRepository, filter);
    return await query.getCount();
  }

  async getNftOwnersCount(identifier: string): Promise<number> {
    const query = this.accountsEsdtRepository
      .createQueryBuilder()
      .where('address != :address', { address: 'pending' })
      .andWhere('token_name = :identifier', { identifier });
    return await query.getCount();
  }

  async getTransfersCount(filter: TransactionFilter): Promise<number> {
    const query = this.indexerHelper.buildTransferFilterQuery(filter);
    return await query.getCount();
  }

  async getTokenCountForAddress(address: string): Promise<number> {
    const query = this.accountsEsdtRepository
      .createQueryBuilder()
      .where('address = :address', { address })
      .andWhere(`(token_identifier IS NULL OR token_identifier = '')`);

    return await query.getCount();
  }

  async getTokenAccountsCount(identifier: string): Promise<number | undefined> {
    const query = this.accountsEsdtRepository
      .createQueryBuilder()
      .where('token_name = :identifier', { identifier });

    return await query.getCount();
  }

  async getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<any[]> {
    const query = this.accountsEsdtRepository
      .createQueryBuilder()
      .skip(pagination.from).take(pagination.size)
      .where(`token_name = :identifier AND address != 'pending'`, { identifier })
      .orderBy('balance_num', 'DESC');

    return await query.getMany();
  }

  async getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number> {
    const query = this.indexerHelper.buildTokensWithRolesForAddressQuery(address, filter);
    return await query.getCount();
  }

  async getNftTagCount(search?: string | undefined): Promise<number> {
    let query = this.tagsRepository.createQueryBuilder();
    if (search) {
      query = query.where(`tag like :search`, { search: `%${search}%` });
    }

    return await query.getCount();
  }

  async getRoundCount(filter: RoundFilter): Promise<number> {
    const query = await this.indexerHelper.buildElasticRoundsFilter(filter);
    return await query.getCount();
  }

  async getAccountScResultsCount(address: string): Promise<number> {
    const query = this.indexerHelper.buildSmartContractResultFilterQuery(address);
    return await query.getCount();
  }

  async getTransactionCountForAddress(address: string): Promise<number> {
    const query = this.transactionsRepository
      .createQueryBuilder()
      .where('sender = :address OR receiver = :address', { address });

    return await query.getCount();
  }

  async getTransactionCount(filter: TransactionFilter, address?: string): Promise<number> {
    const query = this.indexerHelper.buildTransactionFilterQuery(filter, address);
    return await query.getCount();
  }

  async getRound(shard: number, round: number): Promise<any> {
    return await this.roundsRepository.findOneByOrFail({ shardId: shard, index: round });
  }

  async getToken(identifier: string): Promise<any> {
    return await this.tokensRepository.findOneByOrFail({ identifier });
  }

  async getCollection(identifier: string): Promise<any> {
    return await this.tokensRepository.findOneByOrFail({ token: identifier });
  }

  async getTransaction(txHash: string): Promise<any> {
    return await this.transactionsRepository.findOneByOrFail({ hash: txHash });
  }

  async getScDeploy(_address: string): Promise<any> {
    // TODO the "address" column does not exist in "sc_deploy_infos" table
    return await this.scDeploysRepository.findOneByOrFail({});
  }

  async getScResult(scHash: string): Promise<any> {
    return await this.scResultsRepository.findOneByOrFail({ hash: scHash });
  }

  async getBlock(hash: string): Promise<any> {
    return await this.blocksRepository.findOneByOrFail({ hash });
  }

  async getMiniBlock(miniBlockHash: string): Promise<MiniBlock> {
    const query = this.miniBlocksRepository
      .createQueryBuilder()
      .where('hash = :hash', { hash: miniBlockHash });

    return await query.getOneOrFail();
  }

  async getTag(tag: string): Promise<Tag> {
    const query = this.tagsRepository
      .createQueryBuilder()
      .where('tag = :tag', { tag: BinaryUtils.base64Encode(tag) });

    return await query.getOneOrFail();
  }

  async getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<any[]> {
    const sortOrder = !filter.order || filter.order === SortOrder.desc ? 'DESC' : 'ASC';

    const query = this.indexerHelper.buildTransferFilterQuery(filter)
      .skip(pagination.from).take(pagination.size)
      .orderBy('timestamp', sortOrder)
      .addOrderBy('nonce', sortOrder);

    const operations = await query.getMany();
    return operations;
  }

  async getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<any[]> {
    const query = this.indexerHelper.buildTokensWithRolesForAddressQuery(address, filter, pagination);
    const tokenList = await query.getMany();
    return tokenList;
  }

  async getRounds(filter: RoundFilter): Promise<any[]> {
    let query = this.roundsRepository.createQueryBuilder();

    if (filter.condition !== undefined) {
      query = await this.indexerHelper.buildElasticRoundsFilter(filter);
    }

    query = query
      .skip(filter.from).take(filter.size)
      .orderBy('timestamp', 'DESC');

    return await query.getMany();
  }

  async getNftCollections({ from, size }: QueryPagination, filter: CollectionFilter, address?: string): Promise<any[]> {
    const query = this.indexerHelper
      .buildCollectionRolesFilter(filter, address)
      .skip(from).take(size)
      .orderBy('timestamp', 'DESC');

    return await query.getMany();
  }

  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<any[]> {
    const query = this.accountsEsdtRepository
      .createQueryBuilder()
      .skip(0)
      .take(addresses.length)
      .where(`address != 'pending'`)
      .andWhere('token_name = :identifier', { identifier })
      .andWhere('address IN (:...addresses)', { addresses })
      .andWhere('balance_num >= 0');

    return await query.getMany();
  }

  async getNftTags(pagination: QueryPagination, search?: string | undefined): Promise<Tag[]> {
    let query = this.tagsRepository
      .createQueryBuilder()
      .skip(pagination.from)
      .take(pagination.size)
      .orderBy('count', 'DESC');
    if (search) {
      query = query.where('tag like :tag', { tag: `%${search}%` });
    }
    return await query.getMany();
  }

  async getScResults({ from, size }: QueryPagination, filter: SmartContractResultFilter): Promise<any[]> {
    let query = this.scResultsRepository
      .createQueryBuilder()
      .skip(from).take(size);

    if (filter.miniBlockHash) {
      query = query.andWhere('mb_hash = :hash', { hash: filter.miniBlockHash });
    }

    if (filter.originalTxHashes) {
      query = query.andWhere('original_tx_hash IN (:...hashes)', { hashes: filter.originalTxHashes });
    }

    return await query.getMany();
  }

  async getAccountScResults(address: string, { from, size }: QueryPagination): Promise<any[]> {
    const query = this.indexerHelper.buildSmartContractResultFilterQuery(address)
      .skip(from).take(size)
      .orderBy('timestamp', 'DESC');

    return await query.getMany();
  }

  async getAccounts({ from, size }: QueryPagination): Promise<any[]> {
    const query = this.accountsRepository
      .createQueryBuilder()
      .skip(from).take(size)
      .orderBy('balance_num', 'DESC');

    return await query.getMany();
  }

  async getAccountContracts({ from, size }: QueryPagination, address: string): Promise<any[]> {
    const query = this.scDeploysRepository
      .createQueryBuilder()
      .skip(from).take(size)
      .where('creator = :address', { address })
      .orderBy('timestamp', 'DESC');

    return await query.getMany();
  }

  async getAccountHistory(address: string, { from, size }: QueryPagination): Promise<any[]> {
    const query = this.indexerHelper.buildAccountHistoryFilterQuery(address)
      .skip(from).take(size)
      .orderBy('timestamp', 'DESC');

    return await query.getMany();
  }

  async getAccountTokenHistory(address: string, tokenIdentifier: string, { from, size }: QueryPagination): Promise<any[]> {
    const query = this.indexerHelper.buildAccountHistoryFilterQuery(address, tokenIdentifier)
      .skip(from).take(size)
      .orderBy('timestamp', 'DESC');

    return await query.getMany();
  }

  async getTransactions(filter: TransactionFilter, { from, size }: QueryPagination, address?: string): Promise<any[]> {
    const sortOrder = !filter.order || filter.order === SortOrder.desc ? 'DESC' : 'ASC';

    const query = this.indexerHelper
      .buildTransactionFilterQuery(filter, address)
      .skip(from).take(size)
      .orderBy('timestamp', sortOrder)
      .addOrderBy('nonce', sortOrder);

    return await query.getMany();
  }

  async getTokensForAddress(address: string, { from, size }: QueryPagination, filter: TokenFilter): Promise<any[]> {
    let query = this.accountsEsdtRepository.createQueryBuilder()
      .skip(from).take(size)
      .where(`(token_identifier IS NULL OR token_identifier = '')`)
      .andWhere('address = :address', { address });

    if (filter.identifier) {
      query = query.andWhere('token_name = :token', { token: filter.identifier });
    }

    if (filter.identifiers) {
      query = query.andWhere('token_name IN (:...tokens)', { tokens: filter.identifiers });
    }

    // if (filter.name) {
    //   query = query.withMustCondition(QueryType.Nested('data.name', filter.name));
    // }

    // if (filter.search) {
    //   query = query.withMustCondition(QueryType.Nested('data.name', filter.search));
    // }

    return await query.getMany();
  }

  async getTransactionLogs(hashes: string[]): Promise<any[]> {
    const query = this.logsRepository
      .createQueryBuilder()
      .skip(0).take(10000)
      .where('id IN (:...hashes)', { hashes });

    return await query.getMany();
  }

  async getTransactionScResults(txHash: string): Promise<any[]> {
    const query = this.scResultsRepository
      .createQueryBuilder()
      .skip(0).take(100)
      .where('original_tx_hash = :hash', { hash: txHash })
      .orderBy('timestamp', 'ASC');

    return await query.getMany();
  }

  async getScResultsForTransactions(elasticTransactions: any[]): Promise<any[]> {
    const query = this.scResultsRepository
      .createQueryBuilder()
      .skip(0).take(10000)
      .where('original_tx_hash IN (:...hashes)', { hashes: elasticTransactions.filter(x => x.hasScResults === true).map(x => x.txHash) })
      .orderBy('timestamp', 'ASC');

    return await query.getMany();
  }

  async getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<any[]> {
    if (identifiers.length === 0) {
      return [];
    }

    let query = this.accountsEsdtRepository
      .createQueryBuilder()
      .where(`address != 'pending'`)
      .andWhere('token_identifier IN (:...identifiers)', { identifiers })
      .orderBy('balance_num', 'DESC')
      .addOrderBy('timestamp', 'DESC');


    if (pagination) {
      query = query.skip(pagination.from).take(pagination.size);
    }

    return await query.getMany();
  }

  async getNftsForAddress(address: string, filter: NftFilter, { from, size }: QueryPagination): Promise<any[]> {
    const query = this.indexerHelper
      .buildElasticNftFilter(this.accountsEsdtRepository, filter, undefined, address)
      .skip(from).take(size)
      .orderBy('timestamp', 'DESC')
      .addOrderBy('token_nonce', 'DESC');

    return await query.getMany();
  }

  async getNfts({ from, size }: QueryPagination, filter: NftFilter, identifier?: string): Promise<any[]> {
    const tokensQuery = this.indexerHelper
      .buildElasticNftFilter(this.tokensRepository, filter, identifier)
      .skip(from).take(size)
      .orderBy('timestamp', 'DESC')
      .addOrderBy('nonce', 'DESC');

    let elasticNfts = await tokensQuery.getMany();
    if (elasticNfts.length === 0 && identifier !== undefined) {
      const accountsesdtQuery = this.indexerHelper
        .buildElasticNftFilter(this.accountsEsdtRepository, filter, identifier)
        .skip(from).take(size)
        .where('identifier = :identifier', { identifier })
        .orderBy('timestamp', 'DESC')
        .addOrderBy('nonce', 'DESC');

      elasticNfts = await accountsesdtQuery.getMany();
    }
    return elasticNfts;
  }

  async getTransactionBySenderAndNonce(sender: string, nonce: number): Promise<any[]> {
    const query = this.transactionsRepository
      .createQueryBuilder()
      .skip(0).take(1)
      .where('sender = :sender AND nonce = :nonce', { sender, nonce });

    return await query.getMany();
  }

  async getTransactionReceipts(txHash: string): Promise<any[]> {
    const query = this.receiptsRepository
      .createQueryBuilder()
      .skip(0).take(1)
      .where('tx_hash = :txHash', { txHash });

    return await query.getMany();
  }

  async getAllTokensMetadata(action: (items: any[]) => Promise<void>): Promise<void> {
    // TODO could not find a relationship between the "token_infos" and "token_meta_data" tables

    let from = 0;
    const size = 10000;

    let query = this.tokensRepository
      .createQueryBuilder()
      .where('type IN (:...types)', { types: [TokenType.NonFungibleESDT, TokenType.SemiFungibleESDT] })
      .andWhere(`identifier IS NOT NULL AND identifier != ''`);

    let count = 0;
    do {
      query = query.skip(from).take(size);
      const items = await query.getMany();

      if (items.length > 0) {
        await action(items);
      }

      count = items.length;
      from = from + size;
    } while (count >= size);
  }

  async getEsdtAccountsCount(identifier: string): Promise<number> {
    const query = this.accountsEsdtRepository
      .createQueryBuilder()
      .andWhere('token_name = :identifier', { identifier });

    return await query.getCount();
  }

  async getAllAccountsWithToken(identifier: string, action: (items: any[]) => Promise<void>): Promise<void> {
    let from = 0;
    const size = 10000;

    let query = this.accountsEsdtRepository
      .createQueryBuilder()
      .where('token_name = :identifier', { identifier });

    let count = 0;
    do {
      query = query.skip(from).take(size);
      const items = await query.getMany();

      if (items.length > 0) {
        await action(items);
      }

      count = items.length;
      from = from + size;
    } while (count >= size);
  }

  async getPublicKeys(shard: number, epoch: number): Promise<string[] | undefined> {
    const query = this.validatorPublicKeysRepository.createQueryBuilder()
      .where('id = :id', { id: `${shard}_${epoch}` });

    const result = await query.getOne();
    if (result !== null && result?.pubKeys.length > 0) {
      return result.pubKeys;
    }

    return undefined;
  }

  // eslint-disable-next-line require-await
  async getCollectionsForAddress(_address: string, _filter: CollectionFilter, _pagination: QueryPagination): Promise<{ collection: string; count: number; balance: number; }[]> {
    // TODO not implemented
    return [];
  }

  // eslint-disable-next-line require-await
  async getAssetsForToken(_identifier: string): Promise<any> {
    // TODO custom columns cannot be added
    return {};
  }

  async setAssetsForToken(_identifier: string, _value: any): Promise<void> {
    // TODO custom columns cannot be added
  }

  async setIsWhitelistedStorageForToken(_identifier: string, _value: boolean): Promise<void> {
    // TODO custom columns cannot be added
  }

  async setMediaForToken(_identifier: string, _value: any[]): Promise<void> {
    // TODO custom columns cannot be added
  }

  async setMetadataForToken(_identifier: string, _value: any): Promise<void> {
    // TODO custom columns cannot be added
  }
}
