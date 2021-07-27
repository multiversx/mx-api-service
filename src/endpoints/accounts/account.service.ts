import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ElasticService } from '../../helpers/elastic.service';
import { GatewayService } from '../../helpers/gateway.service';
import { AccountDetailed } from './entities/account.detailed';
import { Account } from './entities/account';
import { bech32Decode, bech32Encode, computeShard, mergeObjects, oneDay, oneMinute, padHex } from 'src/helpers/helpers';
import { CachingService } from 'src/helpers/caching.service';
import { VmQueryService } from 'src/endpoints/vm.query/vm.query.service';
import { ApiConfigService } from 'src/helpers/api.config.service';
import { AccountDeferred } from './entities/account.deferred';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { QueryCondition } from 'src/helpers/entities/elastic/query.condition';
import { ElasticPagination } from 'src/helpers/entities/elastic/elastic.pagination';
import { ElasticSortProperty } from 'src/helpers/entities/elastic/elastic.sort.property';
import { ElasticSortOrder } from 'src/helpers/entities/elastic/elastic.sort.order';

@Injectable()
export class AccountService {
  constructor(
    private readonly elasticService: ElasticService, 
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => CachingService))
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService
  ) {}

  async getAccountsCount(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      'account:count',
      async () => await this.elasticService.getCount('accounts'),
      oneMinute()
    );
  }

  async getAccountCodeHash(address: string): Promise<string | undefined> {
    return await this.cachingService.getOrSetCache(
      `codeHash:${address}`,
      async () => this.getAccountCodeHashRaw(address),
      oneDay()
    );
  }

  async getAccountCodeHashRaw(address: string): Promise<string | undefined> {
    let account = await this.getAccount(address);
    return account.codeHash;
  }

  async getAccount(address: string): Promise<AccountDetailed> {
    let query = {
      sender: address,
      receiver: address
    };

    const [
      txCount,
      {
        account: { nonce, balance, code, codeHash, rootHash, username },
      },
    ] = await Promise.all([
      this.elasticService.getCount('transactions', query, QueryCondition.should),
      this.gatewayService.get(`address/${address}`)
    ]);

    let shard = computeShard(bech32Decode(address));

    let result = { address, nonce, balance, code, codeHash, rootHash, txCount, username, shard };

    return result;
  }

  async getAccounts(queryPagination: QueryPagination): Promise<Account[]> {
    const { from, size } = queryPagination;
    const pagination: ElasticPagination = { 
      from, size 
    };

    const sorts: ElasticSortProperty[] = [];
    const balanceNum: ElasticSortProperty = { name: 'balanceNum', order: ElasticSortOrder.descendant };
    sorts.push(balanceNum);

    const query = {};

    let result = await this.elasticService.getList('accounts', 'address', query, pagination, sorts);

    let accounts: Account[] = result.map(item => mergeObjects(new Account(), item));
    for (let account of accounts) {
      account.shard = computeShard(bech32Decode(account.address));
    }

    return accounts;
  }

  async getDeferredAccount(address: string): Promise<AccountDeferred[]> {
    const publicKey = bech32Decode(address);

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

  async getKeys(address: string) {
    let publicKey = bech32Decode(address);

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

        const blsKey = padHex(Buffer.from(encodedBlsKey, 'base64').toString('hex'));
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
      const rewardAddress = bech32Encode(rewardsPublicKey);

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

      let queueSize = '0';
      results.forEach(([result], index) => {
        if (index === 0) {
          queueSize = Buffer.from(result, 'base64').toString();
        } else {
          const [found] = data.filter((x: any) => x.blsKey === queued[index - 1]);

          found.queueIndex = Buffer.from(result, 'base64').toString();
          found.queueSize = queueSize;
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
