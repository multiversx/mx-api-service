import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ElasticService } from '../../helpers/elastic.service';
import { GatewayService } from '../../helpers/gateway.service';
import { AccountDetailed } from './entities/account.detailed';
import { Account } from './entities/account';
import { ElasticPagination } from 'src/helpers/entities/elastic.pagination';
import { bech32Decode, mergeObjects, oneDay, oneMinute } from 'src/helpers/helpers';
import { CachingService } from 'src/helpers/caching.service';
import { VmQueryService } from 'src/endpoints/vm.query/vm.query.service';
import { ApiConfigService } from 'src/helpers/api.config.service';
import { AccountDeferred } from './entities/account.deferred';

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
        account: { nonce, balance, code, codeHash, rootHash },
      },
    ] = await Promise.all([
      this.elasticService.getCount('transactions', query),
      this.gatewayService.get(`address/${address}`)
    ]);

    let result = { address, nonce, balance, code, codeHash, rootHash, txCount };

    return result;
  }

  async getAccounts(from: number, size: number): Promise<Account[]> {
    const sort = {
      balanceNum: 'desc',
    };

    const pagination: ElasticPagination = { 
      from, size 
    };

    const query = {};

    let result = await this.elasticService.getList('accounts', 'address', query, pagination, sort);

    return result.map(item => mergeObjects(new Account(), item));
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

  decode(value: string): string {
    const hex = Buffer.from(value, 'base64').toString('hex');
    return BigInt(hex ? '0x' + hex : hex).toString();
  };
}
