import { Injectable } from "@nestjs/common";
import { Token } from "./entities/token";
import { TokenWithBalance } from "./entities/token.with.balance";
import { TokenDetailed } from "./entities/token.detailed";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ApiUtils } from "src/utils/api.utils";
import { TokenFilter } from "./entities/token.filter";
import { TokenUtils } from "src/utils/token.utils";
import { EsdtService } from "../esdt/esdt.service";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryType } from "src/common/elastic/entities/query.type";
import { ElasticService } from "src/common/elastic/elastic.service";
import { TokenAccount } from "./entities/token.account";
import { QueryOperator } from "src/common/elastic/entities/query.operator";
import { TokenAddressRoles } from "./entities/token.address.roles";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { TransactionService } from "../transactions/transaction.service";
import { RecordUtils } from "src/utils/record.utils";
import { EsdtSupply } from "../esdt/entities/esdt.supply";
import { TokenType } from "./entities/token.type";
import { NumberUtils } from "src/utils/number.utils";

@Injectable()
export class TokenService {

  constructor(
    private readonly esdtService: EsdtService,
    private readonly elasticService: ElasticService,
    private readonly cachingService: CachingService,
    private readonly transactionService: TransactionService,
  ) { }

  async getToken(identifier: string): Promise<TokenDetailed | undefined> {
    const tokens = await this.esdtService.getAllEsdtTokens();
    let token = tokens.find(x => x.identifier === identifier);
    if (!token) {
      return undefined;
    }

    token = ApiUtils.mergeObjects(new TokenDetailed(), token);

    await this.applyTickerFromAssets(token);

    await this.applySupply(token);

    await this.processToken(token);

    return token;
  }

  async getTokens(queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenDetailed[]> {
    const { from, size } = queryPagination;

    let tokens = await this.getFilteredTokens(filter);

    tokens = tokens.slice(from, from + size);

    for (const token of tokens) {
      await this.applyTickerFromAssets(token);
    }

    await this.batchProcessTokens(tokens);

    return tokens.map(item => ApiUtils.mergeObjects(new TokenDetailed(), item));
  }

  async applyTickerFromAssets(token: Token) {
    if (token.assets) {
      token.ticker = token.identifier.split('-')[0];
    } else {
      token.ticker = token.identifier;
    }
  }

  async processToken(token: TokenDetailed) {
    token.transactions = await this.cachingService.getOrSetCache(
      CacheInfo.TokenTransactions(token.identifier).key,
      async () => await this.transactionService.getTransactionCount({ token: token.identifier }),
      CacheInfo.TokenTransactions(token.identifier).ttl
    );

    token.accounts = await this.cachingService.getOrSetCache(
      CacheInfo.TokenAccounts(token.identifier).key,
      async () => await this.esdtService.getTokenAccountsCount(token.identifier),
      CacheInfo.TokenAccounts(token.identifier).ttl
    );
  }

  async batchProcessTokens(tokens: TokenDetailed[]) {
    await this.cachingService.batchApply
      (tokens,
        token => CacheInfo.TokenTransactions(token.identifier).key,
        async tokens => {
          const result: { [key: string]: number } = {};

          for (const token of tokens) {
            const transactions = await this.transactionService.getTransactionCount({ token: token.identifier });

            result[token.identifier] = transactions;
          }

          return RecordUtils.mapKeys(result, identifier => CacheInfo.TokenTransactions(identifier).key);
        },
        (token, transactions) => token.transactions = transactions,
        CacheInfo.TokenTransactions('').ttl,
      );

    await this.cachingService.batchApply
      (tokens,
        token => CacheInfo.TokenAccounts(token.identifier).key,
        async tokens => {
          const result: { [key: string]: number } = {};

          for (const token of tokens) {
            const accounts = await this.esdtService.getTokenAccountsCount(token.identifier);
            result[token.identifier] = accounts;
          }

          return RecordUtils.mapKeys(result, identifier => CacheInfo.TokenAccounts(identifier).key);
        },
        (token, accounts) => token.accounts = accounts,
        CacheInfo.TokenAccounts('').ttl,
      );
  }

  async getFilteredTokens(filter: TokenFilter): Promise<TokenDetailed[]> {
    let tokens = await this.esdtService.getAllEsdtTokens();

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase().includes(searchLower) || token.identifier.toLowerCase().includes(searchLower));
    }

    if (filter.name) {
      const nameLower = filter.name.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase() === nameLower);
    }

    if (filter.identifier) {
      const identifierLower = filter.identifier.toLowerCase();

      tokens = tokens.filter(token => token.identifier.toLowerCase().includes(identifierLower));
    }

    if (filter.identifiers) {
      const identifierArray = filter.identifiers.map(identifier => identifier.toLowerCase());

      tokens = tokens.filter(token => identifierArray.includes(token.identifier.toLowerCase()));
    }

    return tokens;
  }

  async getTokenCount(filter: TokenFilter): Promise<number> {
    const tokens = await this.getFilteredTokens(filter);

    return tokens.length;
  }

  async getTokenCountForAddress(address: string): Promise<number> {
    const tokens = await this.getAllTokensForAddress(address, new TokenFilter());
    return tokens.length;
  }

  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenWithBalance[]> {
    let tokens = await this.getAllTokensForAddress(address, filter);

    tokens = tokens.slice(queryPagination.from, queryPagination.from + queryPagination.size);
    tokens = tokens.map(token => ApiUtils.mergeObjects(new TokenWithBalance(), token));

    for (const token of tokens) {
      await this.applyTickerFromAssets(token);
    }

    return tokens;
  }

  async getTokenForAddress(address: string, identifier: string): Promise<TokenWithBalance | undefined> {
    const tokenFilter = new TokenFilter();
    tokenFilter.identifier = identifier;
    const tokens = await this.getFilteredTokens(tokenFilter);
    if (!tokens.length) {
      return undefined;
    }

    const token = tokens[0];
    const esdt = await this.elasticService.getAccountEsdtByAddressAndIdentifier(address, identifier);
    let tokenWithBalance = {
      ...esdt,
      ...token,
    };
    tokenWithBalance = ApiUtils.mergeObjects(new TokenWithBalance(), tokenWithBalance);

    tokenWithBalance.identifier = token.identifier;

    await this.applyTickerFromAssets(tokenWithBalance);

    await this.applySupply(token);

    return tokenWithBalance;
  }

  async getAllTokensForAddress(address: string, filter: TokenFilter): Promise<TokenWithBalance[]> {
    const tokens = await this.getFilteredTokens(filter);

    const tokensIndexed: { [index: string]: Token } = {};
    for (const token of tokens) {
      tokensIndexed[token.identifier] = token;
    }

    const esdts = await this.esdtService.getAllEsdtsForAddress(address);

    const tokensWithBalance: TokenWithBalance[] = [];

    for (const tokenIdentifier of Object.keys(esdts)) {
      if (!TokenUtils.isEsdt(tokenIdentifier)) {
        continue;
      }

      const esdt = esdts[tokenIdentifier];
      const token = tokensIndexed[tokenIdentifier];
      if (!token) {
        continue;
      }

      const tokenWithBalance = {
        ...token,
        ...esdt,
      };

      tokensWithBalance.push(tokenWithBalance);
    }

    for (const token of tokensWithBalance) {
      // @ts-ignore
      token.identifier = token.tokenIdentifier;
      // @ts-ignore
      delete token.tokenIdentifier;
    }

    return tokensWithBalance;
  }

  async getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<TokenAccount[]> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withPagination(pagination)
      .withSort([{ name: "balanceNum", order: ElasticSortOrder.descending }])
      .withCondition(QueryConditionOptions.must, [QueryType.Match("token", identifier, QueryOperator.AND)])
      .withCondition(QueryConditionOptions.mustNot, [QueryType.Match('address', 'pending')]);

    const tokenAccounts = await this.elasticService.getList("accountsesdt", identifier, elasticQuery);

    return tokenAccounts.map((tokenAccount) => ApiUtils.mergeObjects(new TokenAccount(), tokenAccount));
  }

  async getTokenRoles(identifier: string): Promise<TokenAddressRoles[] | undefined> {
    const token = await this.getToken(identifier);
    if (!token) {
      return undefined;
    }

    return await this.esdtService.getEsdtAddressesRoles(identifier);
  }

  async getTokenRolesForAddress(identifier: string, address: string): Promise<TokenAddressRoles | undefined> {
    const token = await this.getToken(identifier);
    if (!token) {
      return undefined;
    }

    const tokenAddressesRoles = await this.esdtService.getEsdtAddressesRoles(identifier);
    const addressRoles = tokenAddressesRoles?.find((role: TokenAddressRoles) => role.address === address);

    //@ts-ignore
    delete addressRoles?.address;

    return addressRoles;
  }

  async applySupply(token: TokenDetailed): Promise<void> {
    const { totalSupply, circulatingSupply } = await this.esdtService.getTokenSupply(token.identifier);

    token.supply = totalSupply;
    token.circulatingSupply = NumberUtils.denominate(BigInt(circulatingSupply));
  }

  async getTokenSupply(identifier: string): Promise<EsdtSupply | undefined> {
    if (identifier.split('-').length !== 2) {
      return undefined;
    }

    const properties = await this.esdtService.getEsdtTokenProperties(identifier);
    if (!properties) {
      return undefined;
    }

    if (properties.type !== TokenType.FungibleESDT) {
      return undefined;
    }

    return await this.esdtService.getTokenSupply(identifier);
  }
}
