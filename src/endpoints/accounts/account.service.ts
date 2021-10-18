import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ElasticService } from '../../common/elastic.service';
import { GatewayService } from '../../common/gateway.service';
import { AccountDetailed } from './entities/account.detailed';
import { Account } from './entities/account';
import { CachingService } from 'src/common/caching.service';
import { VmQueryService } from 'src/endpoints/vm.query/vm.query.service';
import { ApiConfigService } from 'src/common/api.config.service';
import { AccountDeferred } from './entities/account.deferred';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { ElasticPagination } from 'src/common/entities/elastic/elastic.pagination';
import { ElasticSortProperty } from 'src/common/entities/elastic/elastic.sort.property';
import { ElasticSortOrder } from 'src/common/entities/elastic/elastic.sort.order';
import { ElasticQuery } from 'src/common/entities/elastic/elastic.query';
import { QueryType } from 'src/common/entities/elastic/query.type';
import { Constants } from 'src/utils/constants';
import { AddressUtils } from 'src/utils/address.utils';
import { ApiUtils } from 'src/utils/api.utils';
import { BinaryUtils } from 'src/utils/binary.utils';
import { AccountKey } from './entities/account.key';

@Injectable()
export class AccountService {
  private readonly logger: Logger

  constructor(
    private readonly elasticService: ElasticService, 
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => CachingService))
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService
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

  async getAccount(address: string): Promise<AccountDetailed | null> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition.should = [
      QueryType.Match('sender', address),
      QueryType.Match('receiver', address),
    ]

    try {
      const [
        txCount,
        {
          account: { nonce, balance, code, codeHash, rootHash, username },
        },
      ] = await Promise.all([
        this.elasticService.getCount('transactions', elasticQueryAdapter),
        this.gatewayService.get(`address/${address}`)
      ]);

      let shard = AddressUtils.computeShard(AddressUtils.bech32Decode(address));
  
      let result = { address, nonce, balance, code, codeHash, rootHash, txCount, username, shard };
  
      return result;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when getting account details for address '${address}'`);
      return null;
    }
  }

  async getAccounts(queryPagination: QueryPagination): Promise<Account[]> {
    return this.cachingService.getOrSetCache(
      `accounts:${queryPagination.from}:${queryPagination.size}`,
      async () => await this.getAccountsRaw(queryPagination),
      Constants.oneMinute(),
    );
  }

  async getAccountsRaw(queryPagination: QueryPagination): Promise<Account[]> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    
    const { from, size } = queryPagination;
    const pagination: ElasticPagination = { 
      from, size 
    };
    elasticQueryAdapter.pagination = pagination;

    const balanceNum: ElasticSortProperty = { name: 'balanceNum', order: ElasticSortOrder.descending };
    elasticQueryAdapter.sort = [balanceNum];

    let result = await this.elasticService.getList('accounts', 'address', elasticQueryAdapter);

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

    const numBlocksBeforeUnBond = parseInt(this.decode(encodedNumBlocksBeforeUnBond));
    const erdNonce = parseInt(erdNonceString);

    const data: AccountDeferred[] = encodedUserDeferredPaymentList.reduce((result: AccountDeferred[], _, index, array) => {
      if (index % 2 === 0) {
        const [encodedDeferredPayment, encodedUnstakedNonce] = array.slice(index, index + 2);

        const deferredPayment = this.decode(encodedDeferredPayment);
        const unstakedNonce = parseInt(this.decode(encodedUnstakedNonce));
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

  decode(value: string): string {
    const hex = Buffer.from(value, 'base64').toString('hex');
    return BigInt(hex ? '0x' + hex : hex).toString();
  };
}
