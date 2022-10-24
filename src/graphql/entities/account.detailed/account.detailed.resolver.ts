import { Resolver, ResolveField, Parent, Float, Args } from "@nestjs/graphql";

import { ApplyComplexity } from "@elrondnetwork/erdnest";

import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { AccountDetailedQuery } from "src/graphql/entities/account.detailed/account.detailed.query";
import { AccountService } from "src/endpoints/accounts/account.service";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { CollectionService } from "src/endpoints/collections/collection.service";
import { GetFromAndSizeInput, GetHistoryTokenAccountInput, GetNftCollectionsAccountInput, GetNftsAccountInput, GetTokensAccountInput, GetTransactionsAccountCountInput, GetTransactionsAccountInput, GetTransfersAccountInput } from "src/graphql/entities/account.detailed/account.detailed.input";
import { NftAccountFlat, NftCollectionAccountFlat, TokenWithBalanceAccountFlat } from "src/graphql/entities/account.detailed/account.detailed.object";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftQueryOptions } from "src/endpoints/nfts/entities/nft.query.options";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenService } from "src/endpoints/tokens/token.service";
import { AccountDelegation } from "src/endpoints/stake/entities/account.delegation";
import { DelegationService } from "src/endpoints/delegation/delegation.service";
import { StakeService } from "src/endpoints/stake/stake.service";
import { ProviderStake } from "src/endpoints/stake/entities/provider.stake";
import { DelegationLegacyService } from "src/endpoints/delegation.legacy/delegation.legacy.service";
import { AccountDelegationLegacy } from "src/endpoints/delegation.legacy/entities/account.delegation.legacy";
import { AccountKey } from "src/endpoints/accounts/entities/account.key";
import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionQueryOptions } from "src/endpoints/transactions/entities/transactions.query.options";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { TransferService } from "src/endpoints/transfers/transfer.service";
import { DeployedContract } from "src/endpoints/accounts/entities/deployed.contract";
import { SmartContractResult } from "src/endpoints/sc-results/entities/smart.contract.result";
import { SmartContractResultService } from "src/endpoints/sc-results/scresult.service";
import { AccountHistory } from "src/endpoints/accounts/entities/account.history";
import { AccountEsdtHistory } from "src/endpoints/accounts/entities/account.esdt.history";

@Resolver(() => AccountDetailed)
export class AccountDetailedResolver extends AccountDetailedQuery {
  constructor(
    protected readonly nftService: NftService,
    protected readonly collectionService: CollectionService,
    protected readonly tokenService: TokenService,
    protected readonly delegationService: DelegationService,
    protected readonly delegationLegacyService: DelegationLegacyService,
    protected readonly stakeService: StakeService,
    protected readonly transactionService: TransactionService,
    protected readonly transferService: TransferService,
    protected readonly scResultService: SmartContractResultService,
    accountService: AccountService
  ) {
    super(accountService);
  }

  @ResolveField("txCount", () => Float, { name: "txCount", description: "Transactions count for the given detailed account." })
  public async getAccountDetailedTransactionCount(@Parent() account: AccountDetailed) {
    return await this.accountService.getAccountTxCount(account.address);
  }

  @ResolveField("scrCount", () => Float, { name: "scrCount", description: "Smart contracts count for the given detailed account." })
  public async getAccountDetailedSmartContractCount(@Parent() account: AccountDetailed) {
    return await this.accountService.getAccountScResults(account.address);
  }

  @ResolveField("delegation", () => [AccountDelegation], { name: "delegation", description: "Summarizes all delegation positions with staking providers, together with unDelegation positions for the givven detailed account." })
  public async getDelegationForAddress(@Parent() account: AccountDetailed) {
    return await this.delegationService.getDelegationForAddress(account.address);
  }

  @ResolveField("delegationLegacy", () => AccountDelegationLegacy, { name: "delegationLegacy", description: "Returns staking information related to the legacy delegation pool." })
  public async getAccountDelegationLegacy(@Parent() account: AccountDetailed) {
    return await this.delegationLegacyService.getDelegationForAddress(account.address);
  }

  @ResolveField("stake", () => ProviderStake, { name: "stake", description: "Summarizes total staked amount for the given provider, as well as when and how much unbond will be performed." })
  public async getStakeForAddress(@Parent() account: AccountDetailed) {
    return await this.stakeService.getStakeForAddress(account.address);
  }

  @ResolveField("keys", () => [AccountKey], { name: "keys", description: "Returns all nodes in the node queue where the account is owner." })
  public async getKeys(@Parent() account: AccountDetailed) {
    return await this.accountService.getKeys(account.address);
  }

  @ResolveField("resultsAccount", () => [SmartContractResult], { name: "resultsAccount", description: "Returns smart contract results where the account is sender or receiver." })
  public async getAccountScResults(@Args("input", { description: "Input to retrieve the given sc results for." }) input: GetFromAndSizeInput, @Parent() account: AccountDetailed) {
    return await this.scResultService.getAccountScResults(
      account.address,
      new QueryPagination({
        from: input.from,
        size: input.size,
      }));
  }

  @ResolveField("resultsAccountCount", () => Float, { name: "resultsAccountCount", description: "Returns smart contract results count where the account is sender or receiver." })
  public async getAccountScResultsCount(@Parent() account: AccountDetailed) {
    return await this.scResultService.getAccountScResultsCount(account.address);
  }

  @ResolveField("historyAccount", () => [AccountHistory], { name: "historyAccount", description: "Return account EGLD balance history." })
  public async getAccountHistory(@Args("input", { description: "Input to retrieve the given EGLD balance history for." }) input: GetFromAndSizeInput, @Parent() account: AccountDetailed) {
    return await this.accountService.getAccountHistory(
      account.address,
      new QueryPagination({
        from: input.from,
        size: input.size,
      }));
  }

  @ResolveField("historyTokenAccount", () => [AccountEsdtHistory], { name: "historyTokenAccount", description: "Return account balance history for a specifc token." })
  public async getAccountTokenHistory(@Args("input", { description: "Input to retrieve the given token history for." }) input: GetHistoryTokenAccountInput, @Parent() account: AccountDetailed) {
    return await this.accountService.getAccountTokenHistory(
      account.address,
      input.identifier,
      new QueryPagination({
        from: input.from,
        size: input.size,
      }));
  }

  @ResolveField("contractAccount", () => [DeployedContract], { name: "contractAccount", description: "Contracts for the given detailed account.", nullable: true })
  public async getAccountContracts(@Args("input", { description: "Input to retrieve the given contracts for." }) input: GetFromAndSizeInput, @Parent() account: AccountDetailed) {
    return await this.accountService.getAccountContracts(
      new QueryPagination({
        from: input.from,
        size: input.size,
      }), account.address
    );
  }

  @ResolveField("contractAccountCount", () => Float, { name: "contractAccountCount", description: "Contracts count for the given detailed account." })
  public async getAccountContractsCount(@Parent() account: AccountDetailed) {
    return await this.accountService.getAccountContractsCount(account.address);
  }

  @ResolveField("nftCollections", () => [NftCollectionAccountFlat], { name: "nftCollections", description: "NFT collections for the given detailed account.", nullable: true })
  public async getAccountDetailedNftCollections(@Args("input", { description: "Input to retrieve the given NFT collections for." }) input: GetNftCollectionsAccountInput, @Parent() account: AccountDetailed) {
    return await this.collectionService.getCollectionsForAddress(
      account.address,
      new CollectionFilter({
        search: input.search,
        type: input.type,
      }),
      new QueryPagination({
        from: input.from,
        size: input.size,
      })
    );
  }

  @ResolveField("nfts", () => [NftAccountFlat], { name: "nfts", description: "NFTs for the given detailed account.", nullable: true })
  @ApplyComplexity({ target: NftAccountFlat })
  public async getAccountDetailedNfts(@Args("input", { description: "Input to retrieve the given NFTs for." }) input: GetNftsAccountInput, @Parent() account: AccountDetailed) {
    return await this.nftService.getNftsForAddress(
      account.address,
      new QueryPagination({
        from: input.from,
        size: input.size,
      }),
      new NftFilter({
        search: input.search,
        identifiers: input.identifiers,
        type: input.type,
        name: input.name,
        collections: input.collections,
        tags: input.tags,
        creator: input.creator,
        hasUris: input.hasUris,
        includeFlagged: input.includeFlagged,
      }),
      new NftQueryOptions({
        withSupply: input.withSupply,
      }),
      input.source
    );
  }

  @ResolveField("tokensAccount", () => [TokenWithBalanceAccountFlat], { name: "tokensAccount", description: "Tokens for the given detailed account.", nullable: true })
  public async getTokensForAddress(@Args("input", { description: "Input to retrieve the given tokens for." }) input: GetTokensAccountInput, @Parent() account: AccountDetailed) {
    return await this.tokenService.getTokensForAddress(
      account.address,
      new QueryPagination({
        from: input.from,
        size: input.size,
      }),
      new TokenFilter({
        search: input.search,
        identifier: input.identifier,
        identifiers: input.identifiers,
        name: input.name,
      }),
    );
  }

  @ResolveField("transactionsAccount", () => [Transaction], { name: "transactionsAccount", description: "Transactions for the given detailed account.", nullable: true })
  @ApplyComplexity({ target: Transaction })
  public async getTransactions(@Args("input", { description: "Input to retrieve the given transactions for." }) input: GetTransactionsAccountInput, @Parent() account: AccountDetailed) {
    const options = TransactionQueryOptions.applyDefaultOptions(input.size, new TransactionQueryOptions({
      withScResults: input.withScResults,
      withOperations: input.withOperations,
      withLogs: input.withLogs,
      withScamInfo: input.withScamInfo,
      withUsername: input.withUsername,
    }));

    return await this.transactionService.getTransactions(
      new TransactionFilter({
        sender: input.sender,
        token: input.token,
        function: input.function,
        senderShard: input.senderShard,
        receiverShard: input.receiverShard,
        miniBlockHash: input.miniBlockHash,
        hashes: input.hashes,
        status: input.status,
        search: input.search,
        before: input.before,
        after: input.after,
        order: input.order,
      }),
      new QueryPagination({
        from: input.from,
        size: input.size,
      }),
      options, account.address
    );
  }

  @ResolveField("transactionsAccountCount", () => Float, { name: "transactionsAccountCount", description: "Transactions count for the given detailed account.", nullable: true })
  public async getTransactionCount(@Args("input", { description: "Input to retrieve the given transctions count for." }) input: GetTransactionsAccountCountInput, @Parent() account: AccountDetailed) {
    return await this.transactionService.getTransactionCount(
      new TransactionFilter({
        sender: input.sender,
        token: input.token,
        function: input.function,
        senderShard: input.senderShard,
        receiverShard: input.receiverShard,
        miniBlockHash: input.miniBlockHash,
        hashes: input.hashes,
        status: input.status,
        search: input.search,
        before: input.before,
        after: input.after,
      }),
      account.address
    );
  }

  //Todo: add address
  @ResolveField("transfersAccount", () => [Transaction], { name: "transfersAccount", description: "Returns both transfers triggerred by a user account (type = Transaction), as well as transfers triggerred by smart contracts (type = SmartContractResult), thus providing a full picture of all in/out value transfers for a given account.", nullable: true })
  public async getAccountTransfers(@Args("input", { description: "Input to retrieve the given transfers for." }) input: GetTransfersAccountInput) {
    const options = TransactionQueryOptions.applyDefaultOptions(input.size, { withScamInfo: input.withScamInfo, withUsername: input.withUsername });

    return await this.transferService.getTransfers(
      new TransactionFilter({
        sender: input.sender,
        token: input.token,
        function: input.function,
        senderShard: input.senderShard,
        receiverShard: input.receiverShard,
        miniBlockHash: input.miniBlockHash,
        hashes: input.hashes,
        status: input.status,
        search: input.search,
        before: input.before,
        after: input.after,
        order: input.order,
      }),
      new QueryPagination({
        from: input.from,
        size: input.size,
      }),
      options,
    );
  }
}
