import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ElasticService } from '../../common/elastic.service';
import { AccountDetailed } from './entities/account.detailed';
import { Account } from './entities/account';
import { CachingService } from 'src/common/caching.service';
import { VmQueryService } from 'src/endpoints/vm.query/vm.query.service';
import { ApiConfigService } from 'src/common/api.config.service';
import { AccountDeferred } from './entities/account.deferred';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { ElasticSortOrder } from 'src/common/entities/elastic/elastic.sort.order';
import { ElasticQuery } from 'src/common/entities/elastic/elastic.query';
import { QueryType } from 'src/common/entities/elastic/query.type';
import { Constants } from 'src/utils/constants';
import { AddressUtils } from 'src/utils/address.utils';
import { ApiUtils } from 'src/utils/api.utils';
import { BinaryUtils } from 'src/utils/binary.utils';
import { QueryConditionOptions } from 'src/common/entities/elastic/query.condition.options';
import { ProxyService } from '../proxy/proxy.service';

@Injectable()
export class AccountService {
  private readonly logger: Logger

  constructor(
    private readonly elasticService: ElasticService, 
    private readonly proxyService: ProxyService,
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
    const queries = [
      QueryType.Match('sender', address),
      QueryType.Match('receiver', address),
    ];
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, queries);

    try {
      const [
        txCount,
        {
          account: { nonce, balance, code, codeHash, rootHash, username, developerReward, ownerAddress },
        },
      ] = await Promise.all([
        this.elasticService.getCount('transactions', elasticQuery),
        this.proxyService.getAccount(address)
      ]);

      let shard = AddressUtils.computeShard(AddressUtils.bech32Decode(address));
  
      let result: AccountDetailed = { address, nonce, balance, code, codeHash, rootHash, txCount, username, shard, developerReward, ownerAddress };
  
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
      this.proxyService.getNetworkStatus(this.apiConfigService.getDelegationContractShardId())
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

  async getKeys(address: string): Promise<{ blsKey: string, stake: string, status: string, rewardAddress: string }[]> {
    let publicKey = AddressUtils.bech32Decode(address);

    const BlsKeysStatus = await this.vmQueryService.vmQuery(
      this.apiConfigService.getAuctionContractAddress(),
      'getBlsKeysStatus',
      this.apiConfigService.getAuctionContractAddress(),
      [ publicKey ],
    );

    if (!BlsKeysStatus) {
      return [];
    }

    const queued: any = [];

    const data = BlsKeysStatus.reduce((result: any, _, index, array) => {
      if (index % 2 === 0) {
        const [encodedBlsKey, encodedStatus] = array.slice(index, index + 2);

        const blsKey = BinaryUtils.padHex(Buffer.from(encodedBlsKey, 'base64').toString('hex'));
        const status = Buffer.from(encodedStatus, 'base64').toString();
        const stake = '2500000000000000000000';

        if (status === 'queued') {
          queued.push(blsKey);
        }

        result.push({ blsKey, stake, status });
      }
      return result;
    }, []);

    if (data && data[0] && data[0].blsKey) {
      const [encodedRewardsPublicKey] = await this.vmQueryService.vmQuery(
        this.apiConfigService.getStakingContractAddress(),
        'getRewardAddress',
        undefined,
        [ data[0].blsKey ],
      );

      const rewardsPublicKey = Buffer.from(encodedRewardsPublicKey, 'base64').toString();
      const rewardAddress = AddressUtils.bech32Encode(rewardsPublicKey);

      for (let [index, _] of data.entries()) {
        data[index].rewardAddress = rewardAddress;
      }
    }

    if (queued.length) {
      const results = await Promise.all([
        this.vmQueryService.vmQuery(
          this.apiConfigService.getStakingContractAddress(),
          'getQueueSize',
        ),
        ...queued.map((blsKey: string) =>
          this.vmQueryService.vmQuery(
            this.apiConfigService.getStakingContractAddress(),
            'getQueueIndex',
            this.apiConfigService.getAuctionContractAddress(),
            [ blsKey ],
          )
        ),
      ]);

      let queueSize = '0'

      results.forEach((result, index) => {
        const queueNode = [result] ? result : undefined;
        if (queueNode) {
          if (index === 0) {
            queueSize = Buffer.from(queueNode, 'base64').toString();
          } else {
            const [found] = data.filter((x: any) => x.blsKey === queued[index - 1]);
  
            found.queueIndex = queueNode ? Buffer.from(queueNode, 'base64').toString() : '0';
            found.queueSize = queueSize;
          }
        }
      });
    }

    return data;
  }

  decode(value: string): string {
    const hex = Buffer.from(value, 'base64').toString('hex');
    return BigInt(hex ? '0x' + hex : hex).toString();
  };
}
