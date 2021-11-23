import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { AccountDetailed } from './entities/account.detailed';
import { Account } from './entities/account';
import { CachingService } from 'src/common/caching/caching.service';
import { VmQueryService } from 'src/endpoints/vm.query/vm.query.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { AccountDeferred } from './entities/account.deferred';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { Constants } from 'src/utils/constants';
import { AddressUtils } from 'src/utils/address.utils';
import { ApiUtils } from 'src/utils/api.utils';
import { BinaryUtils } from 'src/utils/binary.utils';
import { AccountKey } from './entities/account.key';
import { QueryConditionOptions } from 'src/common/elastic/entities/query.condition.options';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { ElasticService } from 'src/common/elastic/elastic.service';
import { QueryType } from 'src/common/elastic/entities/query.type';
import { ElasticQuery } from 'src/common/elastic/entities/elastic.query';
import { ElasticSortOrder } from 'src/common/elastic/entities/elastic.sort.order';
import { DeployedContract } from './entities/deployed.contract';
import { CacheInfo } from 'src/common/caching/entities/cache.info';

@Injectable()
export class AccountService {
  private readonly logger: Logger

  constructor(
    private readonly elasticService: ElasticService, 
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => CachingService))
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.logger = new Logger(AccountService.name);
  }

  async getAccountsCount(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      'account:count',
      async () => await this.elasticService.getCount('accounts'),
      Constants.oneMinute()
    );
  }

  async getAccountUsername(address: string): Promise<string | null> {
    return this.cachingService.getOrSetCache(
      `account:${address}:username`,
      async () => await this.getAccountUsernameRaw(address),
      Constants.oneWeek()
    )
  }

  async getAccountUsernameRaw(address: string): Promise<string | null> {
    let account = await this.getAccount(address);
    if (!account) {
      return null;
    }

    return account.username;
  }

  async getAccount(address: string): Promise<AccountDetailed | null> {
    const queries = [
      QueryType.Match('sender', address),
      QueryType.Match('receiver', address),
    ];
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, queries);

    try {
      const [
        txCount,
        scrCount,
        {
          account: { nonce, balance, code, codeHash, rootHash, username, developerReward, ownerAddress },
        },
      ] = await Promise.all([
        this.getTxCount(address),
        this.getAccountScResults(elasticQuery),
        this.gatewayService.get(`address/${address}`)
      ]);

      let shard = AddressUtils.computeShard(AddressUtils.bech32Decode(address));
  
      let result: AccountDetailed = { address, nonce, balance, code, codeHash, rootHash, txCount, scrCount, username, shard, developerReward, ownerAddress };

      if (result.code && !this.apiConfigService.getUseLegacyElastic()) {
        const deployedAt = await this.getAccountDeployedAt(address);
        if (deployedAt) {
          result.deployedAt = deployedAt;
        }
      }
  
      return result;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when getting account details for address '${address}'`);
      return null;
    }
  }

  async getTxCount(address: string): Promise<number> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.TxCount(address).key,
      async() => await this.getTxCountRaw(address),
      CacheInfo.TxCount(address).ttl
    )
  }
  
  async getTxCountRaw(address: string): Promise<number> {
    const queries = [
      QueryType.Match('sender', address),
      QueryType.Match('receiver', address),
    ];
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, queries);

    return await this.elasticService.getCount('transactions', elasticQuery);
  }

  private async getAccountScResults(query: ElasticQuery): Promise<number> {
    if (this.apiConfigService.getUseLegacyElastic()) {
      return 0;
    }

    return await this.elasticService.getCount('scresults', query);
  }

  async getAccountDeployedAt(address: string): Promise<number | null> {
    return await this.cachingService.getOrSetCache(
      `accountDeployedAt:${address}`,
      async () => await this.getAccountDeployedAtRaw(address),
      Constants.oneWeek()
    );
  }

  async getAccountDeployedAtRaw(address: string): Promise<number | null> {
    let scDeploy = await this.elasticService.getItem('scdeploys', '_id', address);
    if (!scDeploy) {
      return null;
    }

    let txHash = scDeploy.deployTxHash;
    if (!txHash) {
      return null;
    }

    let transaction = await this.elasticService.getItem('transactions', '_id', txHash);
    if (!transaction) {
      return null;
    }

    return transaction.timestamp;
  }

  async getAccounts(queryPagination: QueryPagination): Promise<Account[]> {
    return this.cachingService.getOrSetCache(
      `accounts:${queryPagination.from}:${queryPagination.size}`,
      async () => await this.getAccountsRaw(queryPagination),
      Constants.oneMinute(),
    );
  }

  async getAccountsRaw(queryPagination: QueryPagination): Promise<Account[]> {
    const { from, size } = queryPagination;

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from, size })
      .withSort([{ name: 'balanceNum', order: ElasticSortOrder.descending }]);

    let result = await this.elasticService.getList('accounts', 'address', elasticQuery);

    let accounts: Account[] = result.map(item => ApiUtils.mergeObjects(new Account(), item));
    for (let account of accounts) {
      account.shard = AddressUtils.computeShard(AddressUtils.bech32Decode(account.address));
    }

    return accounts;
  }

  async getDeferredAccount(address: string): Promise<AccountDeferred[]> {
    const publicKey = AddressUtils.bech32Decode(address);

    let [
      encodedUserDeferredPaymentList,
      [ encodedNumBlocksBeforeUnBond ],
      {
        status: { erd_nonce: erdNonceString },
      },
    ] = await Promise.all([
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getUserDeferredPaymentList',
        undefined,
        [ publicKey ]
      ),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getNumBlocksBeforeUnBond',
        undefined,
        []
      ),
      this.gatewayService.get(`network/status/${this.apiConfigService.getDelegationContractShardId()}`)
    ]);

    const numBlocksBeforeUnBond = parseInt(BinaryUtils.base64ToBigInt(encodedNumBlocksBeforeUnBond).toString());
    const erdNonce = parseInt(erdNonceString);

    const data: AccountDeferred[] = encodedUserDeferredPaymentList.reduce((result: AccountDeferred[], _, index, array) => {
      if (index % 2 === 0) {
        const [encodedDeferredPayment, encodedUnstakedNonce] = array.slice(index, index + 2);

        const deferredPayment = BinaryUtils.base64ToBigInt(encodedDeferredPayment).toString();
        const unstakedNonce = parseInt(BinaryUtils.base64ToBigInt(encodedUnstakedNonce).toString());
        const blocksLeft = Math.max(0, unstakedNonce + numBlocksBeforeUnBond - erdNonce);
        const secondsLeft = blocksLeft * 6; // 6 seconds per block

        result.push({ deferredPayment, secondsLeft });
      }

      return result;
    }, []);

    return data;
  }

  private async getBlsKeysStatusForPublicKey(publicKey: string) {
    return await this.vmQueryService.vmQuery(
      this.apiConfigService.getAuctionContractAddress(),
      'getBlsKeysStatus',
      this.apiConfigService.getAuctionContractAddress(),
      [ publicKey ],
    );
  }

  private async getRewardAddressForNode(blsKey: string): Promise<string> {
    const [encodedRewardsPublicKey] = await this.vmQueryService.vmQuery(
      this.apiConfigService.getStakingContractAddress(),
      'getRewardAddress',
      undefined,
      [ blsKey ],
    );

    const rewardsPublicKey = Buffer.from(encodedRewardsPublicKey, 'base64').toString();
    const rewardAddress = AddressUtils.bech32Encode(rewardsPublicKey);

    return rewardAddress;
  }

  async getKeys(address: string): Promise<AccountKey[]> {
    let publicKey = AddressUtils.bech32Decode(address);

    const blsKeysStatus = await this.getBlsKeysStatusForPublicKey(publicKey);
    if (!blsKeysStatus) {
      return [];
    }

    const nodes: AccountKey[] = [];
    for (let index = 0; index < blsKeysStatus.length; index+=2) {
      const [encodedBlsKey, encodedStatus] = blsKeysStatus.slice(index, index + 2);

      const accountKey: AccountKey = new AccountKey;
      accountKey.blsKey = BinaryUtils.padHex(Buffer.from(encodedBlsKey, 'base64').toString('hex'));
      accountKey.status = Buffer.from(encodedStatus, 'base64').toString();
      accountKey.stake = '2500000000000000000000';

      nodes.push(accountKey);
    }

    if (nodes.length) {
      const rewardAddress = await this.getRewardAddressForNode(nodes[0].blsKey);

      for (let node of nodes) {
        node.rewardAddress = rewardAddress;
      }
    }

    const queuedNodes: string[] = nodes
      .filter((node: AccountKey) => node.status === 'queued')
      .map(({blsKey}) => blsKey);

    if (queuedNodes.length) {
      const [queueSizeEncoded] = await this.vmQueryService.vmQuery(
        this.apiConfigService.getStakingContractAddress(),
        'getQueueSize',
      );

      if (queueSizeEncoded) {
        const queueSize = Buffer.from(queueSizeEncoded, 'base64').toString();

        const queueIndexes = await Promise.all([
          ...queuedNodes.map((blsKey: string) =>
            this.vmQueryService.vmQuery(
              this.apiConfigService.getStakingContractAddress(),
              'getQueueIndex',
              this.apiConfigService.getAuctionContractAddress(),
              [ blsKey ],
            )
          ),
        ]);

        let index = 0;
        for (let queueIndexEncoded of queueIndexes) {
          if (queueIndexEncoded) {
            const [found] = nodes.filter((x: AccountKey) => x.blsKey === queuedNodes[index]);
    
            found.queueIndex = Buffer.from(queueIndexEncoded[0], 'base64').toString();
            found.queueSize = queueSize;
  
            index ++;
          }
        }
      }
    }

    return nodes;
  }

  async getAccountContracts(address: string): Promise<DeployedContract[]> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [QueryType.Match("deployer", address)])
      .withSort([ { name: 'timestamp', order: ElasticSortOrder.descending } ]);

    const accountDeployedContracts = await this.elasticService.getList('scdeploys', "contract", elasticQuery);

    const accounts: DeployedContract[] = accountDeployedContracts.map(contract => ({
      address: contract.contract,
      deployTxHash: contract.deployTxHash,
      timestamp: contract.timestamp
    }))

    return accounts;
  }
}
