import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { AccountDetailed } from './entities/account.detailed';
import { Account } from './entities/account';
import { VmQueryService } from 'src/endpoints/vm.query/vm.query.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { AccountDeferred } from './entities/account.deferred';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { AccountKey } from './entities/account.key';
import { DeployedContract } from './entities/deployed.contract';
import { TransactionService } from '../transactions/transaction.service';
import { GatewayComponentRequest } from 'src/common/gateway/entities/gateway.component.request';
import { PluginService } from 'src/common/plugins/plugin.service';
import { AccountEsdtHistory } from "./entities/account.esdt.history";
import { AccountHistory } from "./entities/account.history";
import { StakeService } from '../stake/stake.service';
import { TransferService } from '../transfers/transfer.service';
import { SmartContractResultService } from '../sc-results/scresult.service';
import { TransactionType } from '../transactions/entities/transaction.type';
import { AssetsService } from 'src/common/assets/assets.service';
import { AddressUtils, ApiUtils, BinaryUtils, Constants, CachingService, ElasticService, ElasticQuery, ElasticSortOrder, QueryConditionOptions, QueryType, AbstractQuery, QueryOperator } from '@elrondnetwork/erdnest';
import { GatewayService } from 'src/common/gateway/gateway.service';

@Injectable()
export class AccountService {
  private readonly logger: Logger;

  constructor(
    private readonly elasticService: ElasticService,
    private readonly gatewayService: GatewayService,
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    @Inject(forwardRef(() => PluginService))
    private readonly pluginService: PluginService,
    @Inject(forwardRef(() => StakeService))
    private readonly stakeService: StakeService,
    @Inject(forwardRef(() => TransferService))
    private readonly transferService: TransferService,
    @Inject(forwardRef(() => SmartContractResultService))
    private readonly smartContractResultService: SmartContractResultService,
    private readonly assetsService: AssetsService,
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
    return await this.cachingService.getOrSetCache(
      `account:${address}:username`,
      async () => await this.getAccountUsernameRaw(address),
      Constants.oneWeek()
    );
  }

  async getAccountUsernameRaw(address: string): Promise<string | null> {
    const account = await this.getAccount(address);
    if (!account) {
      return null;
    }

    return account.username;
  }

  async getAccount(address: string): Promise<AccountDetailed | null> {
    if (!AddressUtils.isAddressValid(address)) {
      return null;
    }

    const assets = await this.assetsService.getAllAccountAssets();

    try {
      const [
        txCount,
        scrCount,
        {
          account: { nonce, balance, code, codeHash, rootHash, username, developerReward, ownerAddress, codeMetadata },
        },
      ] = await Promise.all([
        this.getAccountTxCount(address),
        this.getAccountScResults(address),
        this.gatewayService.get(`address/${address}`, GatewayComponentRequest.addressDetails),
      ]);

      const shard = AddressUtils.computeShard(AddressUtils.bech32Decode(address));
      let account: AccountDetailed = { address, nonce, balance, code, codeHash, rootHash, txCount, scrCount, username, shard, developerReward, ownerAddress, scamInfo: undefined, assets: assets[address] };

      const codeAttributes = AddressUtils.decodeCodeMetadata(codeMetadata);
      if (codeAttributes) {
        account = { ...account, ...codeAttributes };
      }

      if (account.code && !this.apiConfigService.getUseLegacyElastic()) {
        const deployedAt = await this.getAccountDeployedAt(address);
        if (deployedAt) {
          account.deployedAt = deployedAt;
        }
      }

      await this.pluginService.processAccount(account);
      return account;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when getting account details for address '${address}'`);
      return null;
    }
  }

  private async getAccountTxCount(address: string): Promise<number> {
    if (!this.apiConfigService.getIsIndexerV3FlagActive()) {
      return this.transactionService.getTransactionCountForAddress(address);
    }

    return await this.transferService.getTransfersCount({ address, type: TransactionType.Transaction });
  }

  private async getAccountScResults(address: string): Promise<number> {
    if (this.apiConfigService.getUseLegacyElastic()) {
      return 0;
    }

    if (!this.apiConfigService.getIsIndexerV3FlagActive()) {
      return await this.smartContractResultService.getAccountScResultsCount(address);
    }

    return await this.transferService.getTransfersCount({ address, type: TransactionType.SmartContractResult });
  }

  async getAccountDeployedAt(address: string): Promise<number | null> {
    return await this.cachingService.getOrSetCache(
      `accountDeployedAt:${address}`,
      async () => await this.getAccountDeployedAtRaw(address),
      Constants.oneWeek()
    );
  }

  async getAccountDeployedAtRaw(address: string): Promise<number | null> {
    const scDeploy = await this.elasticService.getItem('scdeploys', '_id', address);
    if (!scDeploy) {
      return null;
    }

    const txHash = scDeploy.deployTxHash;
    if (!txHash) {
      return null;
    }

    const transaction = await this.elasticService.getItem('transactions', '_id', txHash);
    if (!transaction) {
      return null;
    }

    return transaction.timestamp;
  }

  async getAccounts(queryPagination: QueryPagination): Promise<Account[]> {
    return await this.cachingService.getOrSetCache(
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

    const result = await this.elasticService.getList('accounts', 'address', elasticQuery);

    const assets = await this.assetsService.getAllAccountAssets();

    const accounts: Account[] = result.map(item => ApiUtils.mergeObjects(new Account(), item));
    for (const account of accounts) {
      account.shard = AddressUtils.computeShard(AddressUtils.bech32Decode(account.address));
      account.assets = assets[account.address];
    }

    return accounts;
  }

  async getDeferredAccount(address: string): Promise<AccountDeferred[]> {
    const publicKey = AddressUtils.bech32Decode(address);

    const [
      encodedUserDeferredPaymentList,
      [encodedNumBlocksBeforeUnBond],
      {
        status: { erd_nonce: erdNonceString },
      },
    ] = await Promise.all([
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getUserDeferredPaymentList',
        undefined,
        [publicKey]
      ),
      this.vmQueryService.vmQuery(
        this.apiConfigService.getDelegationContractAddress(),
        'getNumBlocksBeforeUnBond',
      ),
      this.gatewayService.get(`network/status/${this.apiConfigService.getDelegationContractShardId()}`, GatewayComponentRequest.networkStatus),
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
      [publicKey],
    );
  }

  private async getRewardAddressForNode(blsKey: string): Promise<string> {
    const [encodedRewardsPublicKey] = await this.vmQueryService.vmQuery(
      this.apiConfigService.getStakingContractAddress(),
      'getRewardAddress',
      undefined,
      [blsKey],
    );

    const rewardsPublicKey = Buffer.from(encodedRewardsPublicKey, 'base64').toString();
    const rewardAddress = AddressUtils.bech32Encode(rewardsPublicKey);

    return rewardAddress;
  }

  async getKeys(address: string): Promise<AccountKey[]> {
    const publicKey = AddressUtils.bech32Decode(address);

    const blsKeysStatus = await this.getBlsKeysStatusForPublicKey(publicKey);
    if (!blsKeysStatus) {
      return [];
    }

    const nodes: AccountKey[] = [];
    for (let index = 0; index < blsKeysStatus.length; index += 2) {
      const [encodedBlsKey, encodedStatus] = blsKeysStatus.slice(index, index + 2);

      const accountKey: AccountKey = new AccountKey;
      accountKey.blsKey = BinaryUtils.padHex(Buffer.from(encodedBlsKey, 'base64').toString('hex'));
      accountKey.status = Buffer.from(encodedStatus, 'base64').toString();
      accountKey.stake = '2500000000000000000000';

      nodes.push(accountKey);
    }

    if (nodes.length) {
      const rewardAddress = await this.getRewardAddressForNode(nodes[0].blsKey);
      const { topUp } = await this.stakeService.getAllStakesForNode(address);

      for (const node of nodes) {
        node.rewardAddress = rewardAddress;
        node.topUp = topUp;
      }
    }

    const queuedNodes: string[] = nodes
      .filter((node: AccountKey) => node.status === 'queued')
      .map(({ blsKey }) => blsKey);

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
              [blsKey],
            )
          ),
        ]);

        let index = 0;
        for (const queueIndexEncoded of queueIndexes) {
          if (queueIndexEncoded) {
            const [found] = nodes.filter((x: AccountKey) => x.blsKey === queuedNodes[index]);

            found.queueIndex = Buffer.from(queueIndexEncoded[0], 'base64').toString();
            found.queueSize = queueSize;

            index++;
          }
        }
      }
    }

    return nodes;
  }

  async getAccountContracts(pagination: QueryPagination, address: string): Promise<DeployedContract[]> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withPagination(pagination)
      .withCondition(QueryConditionOptions.must, [QueryType.Match("deployer", address)])
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const accountDeployedContracts = await this.elasticService.getList('scdeploys', "contract", elasticQuery);

    const accounts: DeployedContract[] = accountDeployedContracts.map(contract => ({
      address: contract.contract,
      deployTxHash: contract.deployTxHash,
      timestamp: contract.timestamp,
    }));

    return accounts;
  }

  async getAccountContractsCount(address: string): Promise<number> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [QueryType.Match("deployer", address)]);

    return await this.elasticService.getCount('scdeploys', elasticQuery);
  }

  async getAccountHistory(address: string, pagination: QueryPagination): Promise<AccountHistory[]> {
    const elasticQuery: ElasticQuery = AccountService.buildAccountHistoryFilterQuery(address)
      .withPagination(pagination)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const elasticResult = await this.elasticService.getList('accountshistory', 'address', elasticQuery);
    return elasticResult.map(item => ApiUtils.mergeObjects(new AccountHistory(), item));
  }

  private static buildAccountHistoryFilterQuery(address?: string, token?: string): ElasticQuery {
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

  async getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination): Promise<AccountEsdtHistory[]> {
    const elasticQuery: ElasticQuery = AccountService.buildAccountHistoryFilterQuery(address, tokenIdentifier)
      .withPagination(pagination)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const elasticResult = await this.elasticService.getList('accountsesdthistory', 'address', elasticQuery);
    return elasticResult.map(item => ApiUtils.mergeObjects(new AccountEsdtHistory(), item));
  }
}
