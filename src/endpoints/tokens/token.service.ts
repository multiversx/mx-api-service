import { Injectable, Logger } from "@nestjs/common";
import { Token } from "./entities/token";
import { TokenWithBalance } from "./entities/token.with.balance";
import { TokenDetailed } from "./entities/token.detailed";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ApiUtils } from "src/utils/api.utils";
import { TokenFilter } from "./entities/token.filter";
import { TokenUtils } from "src/utils/tokens.utils";
import { EsdtService } from "../esdt/esdt.service";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryType } from "src/common/elastic/entities/query.type";
import { ElasticService } from "src/common/elastic/elastic.service";
import { TokenAccount } from "./entities/token.account";
import { QueryOperator } from "src/common/elastic/entities/query.operator";

@Injectable()
export class TokenService {
  private readonly logger: Logger

  constructor(
    private readonly esdtService: EsdtService,
    private readonly elasticService: ElasticService,
  ) {
    this.logger = new Logger(TokenService.name);
  }

  async getToken(identifier: string): Promise<TokenDetailed | undefined> {
    let tokens = await this.esdtService.getAllEsdtTokens();
    let token = tokens.find(x => x.identifier === identifier);
    if (token) {
      token = ApiUtils.mergeObjects(new TokenDetailed(), token);

      await this.applyTickerFromAssets(token);

      token.supply = await this.esdtService.getTokenSupply(identifier);

      return token;
    }

    return undefined;
  }

  async getTokens(queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenDetailed[]> {
    const { from, size } = queryPagination;

    let tokens = await this.getFilteredTokens(filter);

    tokens = tokens.slice(from, from + size);

    for (let token of tokens) {
      await this.applyTickerFromAssets(token);
    }

    return tokens.map(item => ApiUtils.mergeObjects(new TokenDetailed(), item));
  }

  async applyTickerFromAssets(token: Token) {
    if (token.assets) {
      token.ticker = token.identifier.split('-')[0];
    } else {
      token.ticker = token.identifier;
    }
  }

  async getFilteredTokens(filter: TokenFilter): Promise<TokenDetailed[]> {
    let tokens = await this.esdtService.getAllEsdtTokens();

    if (filter.search) {
      let searchLower = filter.search.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase().includes(searchLower) || token.identifier.toLowerCase().includes(searchLower));
    }

    if (filter.name) {
      let nameLower = filter.name.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase() === nameLower);
    }

    if (filter.identifier) {
      let identifierLower = filter.identifier.toLowerCase();

      tokens = tokens.filter(token => token.identifier.toLowerCase().includes(identifierLower));
    }

    if (filter.identifiers) {
      const identifierArray = filter.identifiers.map(identifier => identifier.toLowerCase());

      tokens = tokens.filter(token => identifierArray.includes(token.identifier.toLowerCase()));
    }

    tokens = [...tokens.filter((token) => token.assets), ...tokens].distinctBy((token: TokenDetailed) => token.identifier);

    return tokens;
  }

  async getTokenCount(filter: TokenFilter): Promise<number> {
    let tokens = await this.getFilteredTokens(filter);

    return tokens.length;
  }

  async getTokenCountForAddress(address: string): Promise<number> {
    let tokens = await this.getAllTokensForAddress(address, new TokenFilter());
    return tokens.length;
  }

  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenWithBalance[]> {
    let tokens = await this.getAllTokensForAddress(address, filter);

    tokens = tokens.slice(queryPagination.from, queryPagination.from + queryPagination.size);
    tokens = tokens.map(token => ApiUtils.mergeObjects(new TokenWithBalance(), token));

    for (let token of tokens) {
      await this.applyTickerFromAssets(token);
    }

    return tokens;
  }

  async getTokenForAddress(address: string, identifier: string): Promise<TokenWithBalance | undefined> {
    const tokenFilter = new TokenFilter();
    tokenFilter.identifier = identifier;
    let tokens = await this.getFilteredTokens(tokenFilter);
    if (!tokens.length) {
      return undefined;
    }

    let token = tokens[0];
    let esdt = await this.elasticService.getAccountEsdtByAddressAndIdentifier(address, identifier);
    let tokenWithBalance = {
      ...esdt,
      ...token,
    }
    tokenWithBalance = ApiUtils.mergeObjects(new TokenWithBalance(), tokenWithBalance);

    tokenWithBalance.identifier = token.identifier;

    await this.applyTickerFromAssets(tokenWithBalance);

    tokenWithBalance.supply = await this.esdtService.getTokenSupply(identifier);

    return tokenWithBalance;
  }

  async getAllTokensForAddress(address: string, filter: TokenFilter): Promise<TokenWithBalance[]> {
    let tokens = await this.getFilteredTokens(filter);

    let tokensIndexed: { [index: string]: Token } = {};
    for (let token of tokens) {
      tokensIndexed[token.identifier] = token;
    }

    let esdts = await this.esdtService.getAllEsdtsForAddress(address);

    let tokensWithBalance: TokenWithBalance[] = [];

    for (let tokenIdentifier of Object.keys(esdts)) {
      if (!TokenUtils.isEsdt(tokenIdentifier)) {
        continue;
      }

      let esdt = esdts[tokenIdentifier];
      let token = tokensIndexed[tokenIdentifier];
      if (!token) {
        continue;
      }

      let tokenWithBalance = {
        ...token,
        ...esdt,
      };

      tokensWithBalance.push(tokenWithBalance);
    }

    for (let token of tokensWithBalance) {
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
      .withCondition(QueryConditionOptions.must, [QueryType.Match("token", identifier, QueryOperator.AND)]);

    const tokenAccounts = await this.elasticService.getList("accountsesdt", identifier, elasticQuery);

    return tokenAccounts.map((tokenAccount) => ApiUtils.mergeObjects(new TokenAccount(), tokenAccount));
  }

  async getTokenAccountsCount(identifier: string): Promise<number> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [QueryType.Match("token", identifier, QueryOperator.AND)]);

    const count = await this.elasticService.getCount("accountsesdt", elasticQuery);

    return count;
  }
}