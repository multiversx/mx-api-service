import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AccountDetailed } from './entities/account.detailed';
import { Account } from './entities/account';
import { VmQueryService } from 'src/endpoints/vm.query/vm.query.service';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { AccountDeferred } from './entities/account.deferred';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { AccountKey } from './entities/account.key';
import { DeployedContract } from './entities/deployed.contract';
import { TransactionService } from '../transactions/transaction.service';
import { PluginService } from 'src/common/plugins/plugin.service';
import { AccountEsdtHistory } from "./entities/account.esdt.history";
import { AccountHistory } from "./entities/account.history";
import { StakeService } from '../stake/stake.service';
import { TransferService } from '../transfers/transfer.service';
import { SmartContractResultService } from '../sc-results/scresult.service';
import { TransactionType } from '../transactions/entities/transaction.type';
import { AssetsService } from 'src/common/assets/assets.service';
import { TransactionFilter } from '../transactions/entities/transaction.filter';
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { AddressUtils, BinaryUtils, OriginLogger } from '@multiversx/sdk-nestjs-common';
import { ApiService, ApiUtils } from "@multiversx/sdk-nestjs-http";
import { GatewayService } from 'src/common/gateway/gateway.service';
import { IndexerService } from "src/common/indexer/indexer.service";
import { AccountOptionalFieldOption } from './entities/account.optional.field.options';
import { AccountAssets } from 'src/common/assets/entities/account.assets';
import { CacheInfo } from 'src/utils/cache.info';
import { UsernameService } from '../usernames/username.service';
import { ContractUpgrades } from './entities/contract.upgrades';
import { AccountVerification } from './entities/account.verification';
import { AccountQueryOptions } from './entities/account.query.options';
import { AccountHistoryFilter } from './entities/account.history.filter';
import { ProtocolService } from 'src/common/protocol/protocol.service';
import { ProviderService } from '../providers/provider.service';
import { KeysService } from '../keys/keys.service';
import { NodeStatusRaw } from '../nodes/entities/node.status';
import { AccountKeyFilter } from './entities/account.key.filter';
import { Provider } from '../providers/entities/provider';
import { ApplicationMostUsed } from './entities/application.most.used';

@Injectable()
export class AccountService {
  private readonly logger = new OriginLogger(AccountService.name);

  constructor(
    private readonly indexerService: IndexerService,
    private readonly gatewayService: GatewayService,
    private readonly cachingService: CacheService,
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
    private readonly usernameService: UsernameService,
    private readonly apiService: ApiService,
    private readonly protocolService: ProtocolService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
    private readonly keysService: KeysService
  ) { }

  async getAccountsCount(filter: AccountQueryOptions): Promise<number> {
    if (!filter.ownerAddress && filter.isSmartContract === undefined) {
      return await this.cachingService.getOrSet(
        CacheInfo.AccountsCount.key,
        async () => await this.indexerService.getAccountsCount(filter),
        CacheInfo.AccountsCount.ttl
      );
    }

    return await this.indexerService.getAccountsCount(filter);
  }

  async getAccount(address: string, fields?: string[], withGuardianInfo?: boolean): Promise<AccountDetailed | null> {
    if (!AddressUtils.isAddressValid(address)) {
      return null;
    }

    const provider: Provider | undefined = await this.providerService.getProvider(address);

    let txCount: number = 0;
    let scrCount: number = 0;

    if (!fields || fields.length === 0 || fields.includes(AccountOptionalFieldOption.txCount)) {
      txCount = await this.getAccountTxCount(address);
    }

    if (!fields || fields.length === 0 || fields.includes(AccountOptionalFieldOption.scrCount)) {
      scrCount = await this.getAccountScResults(address);
    }

    const [account, elasticSearchAccount] = await Promise.all([
      this.getAccountRaw(address, txCount, scrCount),
      this.indexerService.getAccount(address),
    ]);

    if (account && withGuardianInfo === true) {
      await this.applyGuardianInfo(account);
    }

    if (account && elasticSearchAccount) {
      account.timestamp = elasticSearchAccount.timestamp;
    }

    if (account && provider && provider.owner) {
      account.ownerAddress = provider.owner;
    }

    return account;
  }

  async applyGuardianInfo(account: AccountDetailed): Promise<void> {
    try {
      const guardianResult = await this.gatewayService.getGuardianData(account.address);
      const guardianData = guardianResult?.guardianData;
      if (guardianData) {
        const activeGuardian = guardianData.activeGuardian;
        if (activeGuardian) {
          account.activeGuardianActivationEpoch = activeGuardian.activationEpoch;
          account.activeGuardianAddress = activeGuardian.address;
          account.activeGuardianServiceUid = activeGuardian.serviceUID;
        }

        const pendingGuardian = guardianData.pendingGuardian;
        if (pendingGuardian) {
          account.pendingGuardianActivationEpoch = pendingGuardian.activationEpoch;
          account.pendingGuardianAddress = pendingGuardian.address;
          account.pendingGuardianServiceUid = pendingGuardian.serviceUID;
        }

        account.isGuarded = guardianData.guarded;
      }
    } catch (error) {
      this.logger.error(`Error when getting guardian data for address '${account.address}'`);
      this.logger.error(error);
    }
  }

  async getAccountVerification(address: string): Promise<AccountVerification | null> {
    if (!AddressUtils.isAddressValid(address)) {
      return null;
    }

    const verificationResponse = await this.apiService.get(`${this.apiConfigService.getVerifierUrl()}/verifier/${address}`);
    return verificationResponse.data;
  }

  async getVerifiedAccounts(): Promise<string[]> {
    const verificationResponse = await this.apiService.get(`${this.apiConfigService.getVerifierUrl()}/verifier`);
    return verificationResponse.data;
  }

  async getAccountSimple(address: string): Promise<AccountDetailed | null> {
    if (!AddressUtils.isAddressValid(address)) {
      return null;
    }

    return await this.getAccountRaw(address);
  }

  async getAccountRaw(address: string, txCount: number = 0, scrCount: number = 0): Promise<AccountDetailed | null> {
    const assets = await this.assetsService.getAllAccountAssets();
    try {
      const {
        account: { nonce, balance, code, codeHash, rootHash, developerReward, ownerAddress, codeMetadata },
      } = await this.gatewayService.getAddressDetails(address);

      const shardCount = await this.protocolService.getShardCount();
      const shard = AddressUtils.computeShard(AddressUtils.bech32Decode(address), shardCount);
      let account = new AccountDetailed({ address, nonce, balance, code, codeHash, rootHash, txCount, scrCount, shard, developerReward, ownerAddress, scamInfo: undefined, assets: assets[address], ownerAssets: assets[ownerAddress], nftCollections: undefined, nfts: undefined });

      const codeAttributes = AddressUtils.decodeCodeMetadata(codeMetadata);
      if (codeAttributes) {
        account = { ...account, ...codeAttributes };
      }

      if (AddressUtils.isSmartContractAddress(address) && account.code) {
        const deployTxHash = await this.getAccountDeployedTxHash(address);
        if (deployTxHash) {
          account.deployTxHash = deployTxHash;
        }

        const deployedAt = await this.getAccountDeployedAt(address);
        if (deployedAt) {
          account.deployedAt = deployedAt;
        }

        const isVerified = await this.getAccountIsVerified(address, account.codeHash);
        if (isVerified) {
          account.isVerified = isVerified;
        }
      }

      if (!AddressUtils.isSmartContractAddress(address)) {
        account.username = await this.usernameService.getUsernameForAddress(address) ?? undefined;
        account.isPayableBySmartContract = undefined;
        account.isUpgradeable = undefined;
        account.isReadable = undefined;
        account.isPayable = undefined;
      }

      await this.pluginService.processAccount(account);
      return account;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when getting account details for address '${address}'`);
      return null;
    }
  }

  async getAccountTxCount(address: string): Promise<number> {
    if (!this.apiConfigService.getIsIndexerV3FlagActive()) {
      return this.transactionService.getTransactionCountForAddress(address);
    }

    return await this.transferService.getTransfersCount(new TransactionFilter({ address, type: TransactionType.Transaction }));
  }

  async getAccountScResults(address: string): Promise<number> {
    if (!this.apiConfigService.getIsIndexerV3FlagActive()) {
      return await this.smartContractResultService.getAccountScResultsCount(address);
    }

    return await this.transferService.getTransfersCount(new TransactionFilter({ address, type: TransactionType.SmartContractResult }));
  }

  async getAccountDeployedAt(address: string): Promise<number | null> {
    return await this.cachingService.getOrSet(
      CacheInfo.AccountDeployedAt(address).key,
      async () => await this.getAccountDeployedAtRaw(address),
      CacheInfo.AccountDeployedAt(address).ttl
    );
  }

  async getAccountDeployedAtRaw(address: string): Promise<number | null> {
    const scDeploy = await this.indexerService.getScDeploy(address);
    if (!scDeploy) {
      return null;
    }

    const txHash = scDeploy.deployTxHash;
    if (!txHash) {
      return null;
    }

    const transaction = await this.indexerService.getTransaction(txHash);
    if (!transaction) {
      return null;
    }

    return transaction.timestamp;
  }

  async getAccountDeployedTxHash(address: string): Promise<string | null> {
    return await this.cachingService.getOrSet(
      CacheInfo.AccountDeployTxHash(address).key,
      async () => await this.getAccountDeployedTxHashRaw(address),
      CacheInfo.AccountDeployTxHash(address).ttl,
    );
  }

  async getAccountDeployedTxHashRaw(address: string): Promise<string | null> {
    const scDeploy = await this.indexerService.getScDeploy(address);
    if (!scDeploy) {
      return null;
    }

    return scDeploy.deployTxHash;
  }

  async getAccountIsVerified(address: string, codeHash: string): Promise<boolean | null> {
    return await this.cachingService.getOrSet(
      CacheInfo.AccountIsVerified(address).key,
      async () => await this.getAccountIsVerifiedRaw(address, codeHash),
      CacheInfo.AccountIsVerified(address).ttl
    );
  }

  async getAccountIsVerifiedRaw(address: string, codeHash: string): Promise<boolean | null> {
    try {
      // eslint-disable-next-line require-await
      const { data } = await this.apiService.get(`${this.apiConfigService.getVerifierUrl()}/verifier/${address}/codehash`, undefined, async (error) => error.response?.status === HttpStatus.NOT_FOUND);

      if (data.codeHash === Buffer.from(codeHash, 'base64').toString('hex')) {
        return true;
      }
    } catch {
      // ignore
    }

    return null;
  }

  async getAccounts(queryPagination: QueryPagination, filter: AccountQueryOptions): Promise<Account[]> {
    if (!filter.isSet()) {
      return await this.cachingService.getOrSet(
        CacheInfo.Accounts(queryPagination).key,
        async () => await this.getAccountsRaw(queryPagination, filter),
        CacheInfo.Accounts(queryPagination).ttl
      );
    }

    return await this.getAccountsRaw(queryPagination, filter);
  }

  public async getAccountsForAddresses(addresses: Array<string>): Promise<Array<Account>> {
    const assets: { [key: string]: AccountAssets; } = await this.assetsService.getAllAccountAssets();

    const accountsRaw = await this.indexerService.getAccountsForAddresses(addresses);
    const accounts: Array<Account> = accountsRaw.map(account => ApiUtils.mergeObjects(new Account(), account));
    const shardCount = await this.protocolService.getShardCount();

    for (const account of accounts) {
      account.shard = AddressUtils.computeShard(AddressUtils.bech32Decode(account.address), shardCount);
      account.assets = assets[account.address];
    }

    return accounts;
  }

  async getAccountsRaw(queryPagination: QueryPagination, options: AccountQueryOptions): Promise<Account[]> {
    const result = await this.indexerService.getAccounts(queryPagination, options);
    const assets = await this.assetsService.getAllAccountAssets();
    const accounts: Account[] = result.map(item => {
      const account = ApiUtils.mergeObjects(new Account(), item);
      account.ownerAddress = item.currentOwner;
      account.transfersLast24h = item.api_transfersLast24h;

      return account;
    });

    const shardCount = await this.protocolService.getShardCount();

    const verifiedAccounts = await this.cachingService.get<string[]>(CacheInfo.VerifiedAccounts.key);

    for (const account of accounts) {
      account.shard = AddressUtils.computeShard(AddressUtils.bech32Decode(account.address), shardCount);
      account.assets = assets[account.address];

      if (options.withDeployInfo && AddressUtils.isSmartContractAddress(account.address)) {
        const [deployedAt, deployTxHash] = await Promise.all([
          this.getAccountDeployedAt(account.address),
          this.getAccountDeployedTxHash(account.address),
        ]);

        account.deployedAt = deployedAt;
        account.deployTxHash = deployTxHash;
      }

      if (options.withTxCount) {
        account.txCount = await this.getAccountTxCount(account.address);
      }

      if (options.withScrCount) {
        account.scrCount = await this.getAccountScResults(account.address);
      }

      if (options.withOwnerAssets && account.ownerAddress) {
        account.ownerAssets = assets[account.ownerAddress];
      }

      if (verifiedAccounts && verifiedAccounts.includes(account.address)) {
        account.isVerified = true;
      }


    }

    return accounts;
  }

  async getDeferredAccount(address: string): Promise<AccountDeferred[]> {
    const publicKey = AddressUtils.bech32Decode(address);
    const delegationContractAddress = this.apiConfigService.getDelegationContractAddress();
    if (!delegationContractAddress) {
      return [];
    }

    const delegationContractShardId = AddressUtils.computeShard(AddressUtils.bech32Decode(delegationContractAddress), await this.protocolService.getShardCount());

    const [
      encodedUserDeferredPaymentList,
      [encodedNumBlocksBeforeUnBond],
      {
        erd_nonce,
      },
    ] = await Promise.all([
      this.vmQueryService.vmQuery(
        delegationContractAddress,
        'getUserDeferredPaymentList',
        undefined,
        [publicKey]
      ),
      this.vmQueryService.vmQuery(
        delegationContractAddress,
        'getNumBlocksBeforeUnBond',
      ),
      this.gatewayService.getNetworkStatus(`${delegationContractShardId}`),
    ]);

    const numBlocksBeforeUnBond = parseInt(BinaryUtils.base64ToBigInt(encodedNumBlocksBeforeUnBond).toString());
    const erdNonce = erd_nonce;

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
    const auctionContractAddress = this.apiConfigService.getAuctionContractAddress();
    if (!auctionContractAddress) {
      return undefined;
    }

    return await this.vmQueryService.vmQuery(
      auctionContractAddress,
      'getBlsKeysStatus',
      auctionContractAddress,
      [publicKey],
    );
  }

  private async getRewardAddressForNode(blsKey: string): Promise<string> {
    const stakingContractAddress = this.apiConfigService.getStakingContractAddress();
    if (!stakingContractAddress) {
      return '';
    }

    const [encodedRewardsPublicKey] = await this.vmQueryService.vmQuery(
      stakingContractAddress,
      'getRewardAddress',
      undefined,
      [blsKey],
    );

    const rewardsPublicKey = Buffer.from(encodedRewardsPublicKey, 'base64').toString();
    return AddressUtils.bech32Encode(rewardsPublicKey);
  }

  private async getAllNodeStates(address: string) {
    return await this.vmQueryService.vmQuery(
      address,
      'getAllNodeStates'
    );
  }

  async getKeys(address: string, filter: AccountKeyFilter, pagination: QueryPagination): Promise<AccountKey[]> {
    const { from, size } = pagination;
    const publicKey = AddressUtils.bech32Decode(address);
    const isStakingProvider = await this.providerService.isProvider(address);

    let notStakedNodes: AccountKey[] = [];

    if (isStakingProvider) {
      const allNodeStates = await this.getAllNodeStates(address);
      const inactiveNodesBuffers = this.getInactiveNodesBuffers(allNodeStates);
      notStakedNodes = this.createNotStakedNodes(inactiveNodesBuffers);
    }

    const blsKeysStatus = await this.getBlsKeysStatusForPublicKey(publicKey);
    let nodes: AccountKey[] = [];

    if (blsKeysStatus) {
      nodes = this.createAccountKeys(blsKeysStatus);
      await this.applyRewardAddressAndTopUpToNodes(nodes, address);
      await this.applyNodeUnbondingPeriods(nodes);
      await this.updateQueuedNodes(nodes);
    }

    let filteredNodes = [...notStakedNodes, ...nodes];

    if (filter && filter.status && filter.status.length > 0) {
      filteredNodes = filteredNodes.filter(node => filter.status.includes(node.status as NodeStatusRaw));
      filteredNodes = this.sortNodesByStatus(filteredNodes, filter.status);
    }

    return filteredNodes.slice(from, from + size);
  }

  getInactiveNodesBuffers(allNodeStates: string[]): string[] {
    if (!allNodeStates) {
      return [];
    }

    const checkIfCurrentItemIsStatus = (currentNodeData: string) =>
      Object.values(NodeStatusRaw).includes(
        currentNodeData as NodeStatusRaw
      );

    return allNodeStates.reduce(
      (totalNodes: string[], currentNodeState, nodeIndex, allNodesDataArray) => {
        const decodedData = Buffer.from(currentNodeState, 'base64').toString();
        const isNotStakedStatus =
          decodedData === NodeStatusRaw.notStaked;

        const isCurrentItemTheStatus = checkIfCurrentItemIsStatus(decodedData);

        const nextStatusItemIndex = allNodesDataArray.findIndex(
          (nodeData, nodeDataIndex) =>
            nodeIndex < nodeDataIndex
              ? checkIfCurrentItemIsStatus(Buffer.from(nodeData, 'base64').toString())
              : false
        );

        if (isCurrentItemTheStatus && nextStatusItemIndex < 0 && isNotStakedStatus) {
          return [...totalNodes, ...allNodesDataArray.slice(nodeIndex + 1)];
        }

        if (isCurrentItemTheStatus && isNotStakedStatus) {
          return [...totalNodes, ...allNodesDataArray.slice(nodeIndex + 1, nextStatusItemIndex)];
        }

        return totalNodes;
      },
      []
    );
  }

  createNotStakedNodes(inactiveNodesBuffers: string[]): AccountKey[] {
    return inactiveNodesBuffers.map((inactiveNodeBuffer) => {
      const accountKey: AccountKey = new AccountKey();
      accountKey.blsKey = BinaryUtils.padHex(Buffer.from(inactiveNodeBuffer, 'base64').toString('hex'));
      accountKey.status = NodeStatusRaw.notStaked;
      accountKey.stake = '2500000000000000000000';

      return accountKey;
    });
  }

  createAccountKeys(blsKeysStatus: string[]): AccountKey[] {
    const nodes: AccountKey[] = [];
    for (let index = 0; index < blsKeysStatus.length; index += 2) {
      const [encodedBlsKey, encodedStatus] = blsKeysStatus.slice(index, index + 2);

      const accountKey: AccountKey = new AccountKey();
      accountKey.blsKey = BinaryUtils.padHex(Buffer.from(encodedBlsKey, 'base64').toString('hex'));
      accountKey.status = Buffer.from(encodedStatus, 'base64').toString();
      accountKey.stake = '2500000000000000000000';

      nodes.push(accountKey);
    }
    return nodes;
  }

  private sortNodesByStatus(nodes: AccountKey[], status: NodeStatusRaw[]): AccountKey[] {
    return nodes.sorted(node => {
      const statusIndex = status.indexOf(node.status as NodeStatusRaw);
      return statusIndex === -1 ? status.length : statusIndex;
    });
  }

  async applyRewardAddressAndTopUpToNodes(nodes: AccountKey[], address: string) {
    if (nodes.length) {
      const rewardAddress = await this.getRewardAddressForNode(nodes[0].blsKey);
      const { topUp } = await this.stakeService.getAllStakesForNode(address);

      for (const node of nodes) {
        node.rewardAddress = rewardAddress;
        node.topUp = topUp;
        node.remainingUnBondPeriod = undefined;
      }
    }
  }

  async updateQueuedNodes(nodes: AccountKey[]) {
    const stakingContractAddress = this.apiConfigService.getStakingContractAddress();
    if (!stakingContractAddress) {
      return;
    }

    const queuedNodes: string[] = nodes
      .filter((node: AccountKey) => node.status === 'queued')
      .map(({ blsKey }) => blsKey);

    if (queuedNodes.length) {
      const [queueSizeEncoded] = await this.vmQueryService.vmQuery(
        stakingContractAddress,
        'getQueueSize',
      );

      if (queueSizeEncoded) {
        const queueSize = Buffer.from(queueSizeEncoded, 'base64').toString();

        const queueIndexes = await Promise.all(
          queuedNodes.map((blsKey: string) =>
            this.vmQueryService.vmQuery(
              stakingContractAddress,
              'getQueueIndex',
              this.apiConfigService.getAuctionContractAddress(),
              [blsKey],
            )
          ),
        );

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
  }

  async getAccountContracts(pagination: QueryPagination, address: string): Promise<DeployedContract[]> {
    const accountDeployedContracts = await this.indexerService.getAccountContracts(pagination, address);
    const assets = await this.assetsService.getAllAccountAssets();

    const accounts: DeployedContract[] = accountDeployedContracts.map(contract => ({
      address: contract.contract,
      deployTxHash: contract.deployTxHash,
      timestamp: contract.timestamp,
      assets: assets[contract.contract],
    }));

    return accounts;
  }

  async getAccountContractsCount(address: string): Promise<number> {
    return await this.indexerService.getAccountContractsCount(address);
  }

  async getContractUpgrades(queryPagination: QueryPagination, address: string): Promise<ContractUpgrades[]> {
    const details = await this.indexerService.getScDeploy(address);
    if (!details) {
      return [];
    }

    const upgrades = details.upgrades.map(item => ApiUtils.mergeObjects(new ContractUpgrades(), {
      address: item.upgrader,
      txHash: item.upgradeTxHash,
      codeHash: item.codeHash,
      timestamp: item.timestamp,
    })).sortedDescending(item => item.timestamp);

    return upgrades.slice(queryPagination.from, queryPagination.from + queryPagination.size);
  }

  async getAccountHistory(address: string, pagination: QueryPagination, filter: AccountHistoryFilter): Promise<AccountHistory[]> {
    const elasticResult = await this.indexerService.getAccountHistory(address, pagination, filter);
    return elasticResult.map(item => ApiUtils.mergeObjects(new AccountHistory(), item));
  }

  async getAccountHistoryCount(address: string, filter: AccountHistoryFilter): Promise<number> {
    return await this.indexerService.getAccountHistoryCount(address, filter);
  }

  async getAccountTokenHistoryCount(address: string, tokenIdentifier: string, filter: AccountHistoryFilter): Promise<number> {
    return await this.indexerService.getAccountTokenHistoryCount(address, tokenIdentifier, filter);
  }

  async getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination, filter: AccountHistoryFilter): Promise<AccountEsdtHistory[]> {
    const elasticResult = await this.indexerService.getAccountTokenHistory(address, tokenIdentifier, pagination, filter);
    return elasticResult.map(item => ApiUtils.mergeObjects(new AccountEsdtHistory(), item));
  }

  private async applyNodeUnbondingPeriods(nodes: AccountKey[]): Promise<void> {
    const leavingNodes = nodes.filter(node => node.status === 'unStaked');
    await Promise.all(leavingNodes.map(async node => {
      const keyUnbondPeriod = await this.keysService.getKeyUnbondPeriod(node.blsKey);
      node.remainingUnBondPeriod = keyUnbondPeriod?.remainingUnBondPeriod;
    }));
  }

  async getApplicationMostUsed(): Promise<ApplicationMostUsed[]> {
    return await this.cachingService.getOrSet(
      CacheInfo.ApplicationMostUsed.key,
      async () => await this.getApplicationMostUsedRaw(),
      CacheInfo.ApplicationMostUsed.ttl
    );
  }

  async getApplicationMostUsedRaw(): Promise<ApplicationMostUsed[]> {
    const { data: mostUsedApplications } = await this.apiService.get(this.apiConfigService.getMostUsedApplicationsUrl());
    return mostUsedApplications.map((item: any) => new ApplicationMostUsed({
      address: item.key,
      transfers24H: item.value,
    }));
  }
}
