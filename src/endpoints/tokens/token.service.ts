import { Injectable, Logger } from "@nestjs/common";
import { Token } from "./entities/token";
import { TokenWithBalance } from "./entities/token.with.balance";
import { TokenDetailed } from "./entities/token.detailed";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TokenFilter } from "./entities/token.filter";
import { TokenHelpers } from "src/utils/token.helpers";
import { EsdtService } from "../esdt/esdt.service";
import { TokenAccount } from "./entities/token.account";
import { TokenType } from "./entities/token.type";
import { EsdtAddressService } from "../esdt/esdt.address.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { TokenProperties } from "./entities/token.properties";
import { TokenRoles } from "./entities/token.roles";
import { TokenSupplyResult } from "./entities/token.supply.result";
import { TokenDetailedWithBalance } from "./entities/token.detailed.with.balance";
import { SortOrder } from "src/common/entities/sort.order";
import { TokenSort } from "./entities/token.sort";
import { TokenWithRoles } from "./entities/token.with.roles";
import { TokenWithRolesFilter } from "./entities/token.with.roles.filter";
import { AddressUtils, ApiUtils, NumberUtils, TokenUtils } from "@elrondnetwork/erdnest";
import { IndexerService } from "src/common/indexer/indexer.service";

@Injectable()
export class TokenService {
  private readonly logger: Logger;
  constructor(
    private readonly esdtService: EsdtService,
    private readonly indexerService: IndexerService,
    private readonly esdtAddressService: EsdtAddressService,
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService
  ) {
    this.logger = new Logger(TokenService.name);
  }

  async isToken(identifier: string): Promise<boolean> {
    const tokens = await this.esdtService.getAllEsdtTokens();
    return tokens.find(x => x.identifier === identifier) !== undefined;
  }

  async getToken(identifier: string): Promise<TokenDetailed | undefined> {
    const tokens = await this.esdtService.getAllEsdtTokens();
    let token = tokens.find(x => x.identifier === identifier);

    if (!TokenUtils.isToken(identifier)) {
      return undefined;
    }

    if (!token) {
      return undefined;
    }

    token = ApiUtils.mergeObjects(new TokenDetailed(), token);

    await this.applyTickerFromAssets(token);

    await this.applySupply(token);

    token.roles = await this.getTokenRoles(identifier);

    return token;
  }

  async getTokens(queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenDetailed[]> {
    const { from, size } = queryPagination;

    let tokens = await this.getFilteredTokens(filter);

    tokens = tokens.slice(from, from + size);

    for (const token of tokens) {
      this.applyTickerFromAssets(token);
    }

    return tokens.map(item => ApiUtils.mergeObjects(new TokenDetailed(), item));
  }

  applyTickerFromAssets(token: Token) {
    if (token.assets) {
      token.ticker = token.identifier.split('-')[0];
    } else {
      token.ticker = token.identifier;
    }
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

    if (filter.sort) {
      tokens = this.sortTokens(tokens, filter.sort, filter.order ?? SortOrder.desc);
    }

    return tokens;
  }

  private sortTokens(tokens: TokenDetailed[], sort: TokenSort, order: SortOrder): TokenDetailed[] {
    let criteria: (token: Token) => number;

    switch (sort) {
      case TokenSort.accounts:
        criteria = token => token.accounts ?? 0;
        break;
      case TokenSort.transactions:
        criteria = token => token.transactions ?? 0;
        break;
      case TokenSort.price:
        criteria = token => token.price ?? 0;
        break;
      case TokenSort.marketCap:
        criteria = token => token.marketCap ?? 0;
        break;
      default:
        throw new Error(`Unsupported sorting criteria '${sort}'`);
    }

    switch (order) {
      case SortOrder.asc:
        tokens = tokens.sorted(criteria);
        break;
      case SortOrder.desc:
        tokens = tokens.sortedDescending(criteria);
        break;
    }

    return tokens;
  }

  async getTokenCount(filter: TokenFilter): Promise<number> {
    const tokens = await this.getFilteredTokens(filter);

    return tokens.length;
  }

  async getTokenCountForAddress(address: string): Promise<number> {
    if (AddressUtils.isSmartContractAddress(address)) {
      return await this.getTokenCountForAddressFromElastic(address);
    }

    return await this.getTokenCountForAddressFromGateway(address);
  }

  async getTokenCountForAddressFromElastic(address: string): Promise<number> {
    return await this.indexerService.getTokenCountForAddress(address);
  }

  async getTokenCountForAddressFromGateway(address: string): Promise<number> {
    const tokens = await this.getAllTokensForAddress(address, new TokenFilter());
    return tokens.length;
  }

  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenWithBalance[]> {
    if (AddressUtils.isSmartContractAddress(address)) {
      return await this.getTokensForAddressFromElastic(address, queryPagination, filter);
    }

    return await this.getTokensForAddressFromGateway(address, queryPagination, filter);
  }

  async getTokensForAddressFromElastic(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenWithBalance[]> {
    const elasticTokens = await this.indexerService.getTokensForAddress(address, queryPagination, filter);

    const elasticTokensWithBalance = elasticTokens.toRecord(token => token.token, token => token.balance);

    const allTokens = await this.esdtService.getAllEsdtTokens();

    const result: TokenWithBalance[] = [];
    for (const token of allTokens) {
      if (elasticTokensWithBalance[token.identifier]) {
        const tokenWithBalance: TokenWithBalance = {
          ...token,
          balance: elasticTokensWithBalance[token.identifier],
          valueUsd: undefined,
        };

        this.applyValueUsd(tokenWithBalance);

        result.push(tokenWithBalance);
      }
    }

    return result;
  }

  applyValueUsd(tokenWithBalance: TokenWithBalance) {
    if (tokenWithBalance.price) {
      tokenWithBalance.valueUsd = tokenWithBalance.price * NumberUtils.denominateString(tokenWithBalance.balance, tokenWithBalance.decimals);
    }
  }

  async getTokensForAddressFromGateway(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenWithBalance[]> {
    let tokens = await this.getAllTokensForAddress(address, filter);

    tokens = tokens.slice(queryPagination.from, queryPagination.from + queryPagination.size);
    tokens = tokens.map(token => ApiUtils.mergeObjects(new TokenWithBalance(), token));

    for (const token of tokens) {
      this.applyTickerFromAssets(token);

      this.applyValueUsd(token);
    }

    return tokens;
  }

  async getTokenForAddress(address: string, identifier: string): Promise<TokenDetailedWithBalance | undefined> {
    const tokens = await this.getFilteredTokens({ identifier });

    if (!TokenUtils.isToken(identifier)) {
      return undefined;
    }

    if (!tokens.length) {
      this.logger.log(`Error when fetching token ${identifier} details for address ${address}`);
      return undefined;
    }

    const token = tokens[0];
    // eslint-disable-next-line require-await
    const esdt = await this.gatewayService.get(`address/${address}/esdt/${identifier}`, GatewayComponentRequest.addressEsdtBalance, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return true;
      }

      return false;
    });

    if (!esdt || !esdt.tokenData || esdt.tokenData.balance === '0') {
      return undefined;
    }

    const balance = esdt.tokenData.balance;
    let tokenWithBalance: TokenDetailedWithBalance = {
      ...token,
      balance,
      valueUsd: undefined,
    };
    tokenWithBalance = ApiUtils.mergeObjects(new TokenDetailedWithBalance(), tokenWithBalance);

    this.applyValueUsd(tokenWithBalance);

    tokenWithBalance.identifier = token.identifier;

    await this.applyTickerFromAssets(tokenWithBalance);

    await this.applySupply(tokenWithBalance);

    return tokenWithBalance;
  }

  async getAllTokensForAddress(address: string, filter: TokenFilter): Promise<TokenWithBalance[]> {
    const tokens = await this.getFilteredTokens(filter);

    const tokensIndexed: { [index: string]: Token } = {};
    for (const token of tokens) {
      tokensIndexed[token.identifier] = token;
    }

    const esdts = await this.esdtAddressService.getAllEsdtsForAddressFromGateway(address);

    const tokensWithBalance: TokenWithBalance[] = [];

    for (const tokenIdentifier of Object.keys(esdts)) {
      if (!TokenUtils.isToken(tokenIdentifier)) {
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

  async getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<TokenAccount[] | undefined> {
    const properties = await this.getTokenProperties(identifier);
    if (!properties) {
      return undefined;
    }

    const tokenAccounts = await this.indexerService.getTokenAccounts(pagination, identifier);
    return tokenAccounts.map((tokenAccount) => ApiUtils.mergeObjects(new TokenAccount(), tokenAccount));
  }

  async getTokenAccountsCount(identifier: string): Promise<number | undefined> {
    const properties = await this.getTokenProperties(identifier);
    if (!properties) {
      return undefined;
    }

    const count = await this.indexerService.getTokenAccountsCount(identifier);
    return count;
  }

  private async getTokenRolesFromElastic(identifier: string): Promise<TokenRoles[] | undefined> {
    const token = await this.indexerService.getToken(identifier);
    if (!token) {
      return undefined;
    }

    if (!token.roles) {
      return undefined;
    }

    const roles: TokenRoles[] = [];
    for (const role of Object.keys(token.roles)) {
      const addresses = token.roles[role].distinct();

      for (const address of addresses) {
        let addressRole = roles.find((addressRole) => addressRole.address === address);
        if (!addressRole) {
          addressRole = new TokenRoles();
          addressRole.address = address;
          roles.push(addressRole);
        }

        TokenHelpers.setTokenRole(addressRole, role);
      }
    }

    return roles;
  }

  async getTokenRoles(identifier: string): Promise<TokenRoles[] | undefined> {
    if (this.apiConfigService.getIsIndexerV3FlagActive()) {
      return await this.getTokenRolesFromElastic(identifier);
    }

    return await this.esdtService.getEsdtAddressesRoles(identifier);
  }

  async getTokenRolesForIdentifierAndAddress(identifier: string, address: string): Promise<TokenRoles | undefined> {
    if (this.apiConfigService.getIsIndexerV3FlagActive()) {
      const token = await this.indexerService.getToken(identifier);

      if (!token) {
        return undefined;
      }

      if (!token.roles) {
        return undefined;
      }

      const addressRoles: TokenRoles = new TokenRoles();
      addressRoles.address = address;
      for (const role of Object.keys(token.roles)) {
        const addresses = token.roles[role].distinct();
        if (addresses.includes(address)) {
          TokenHelpers.setTokenRole(addressRoles, role);
        }
      }

      //@ts-ignore
      delete addressRoles.address;

      return addressRoles;
    }

    const tokenAddressesRoles = await this.esdtService.getEsdtAddressesRoles(identifier);
    let addressRoles = tokenAddressesRoles?.find((role: TokenRoles) => role.address === address);
    if (addressRoles) {
      // clone
      addressRoles = new TokenRoles(JSON.parse(JSON.stringify(addressRoles)));

      //@ts-ignore
      delete addressRoles?.address;
    }

    return addressRoles;
  }

  async applySupply(token: TokenDetailed): Promise<void> {
    const supply = await this.esdtService.getTokenSupply(token.identifier);

    token.supply = NumberUtils.denominate(BigInt(supply.totalSupply), token.decimals).toFixed();
    token.circulatingSupply = NumberUtils.denominate(BigInt(supply.circulatingSupply), token.decimals).toFixed();

    if (supply.minted) {
      token.minted = supply.minted;
    }

    if (supply.burned) {
      token.burnt = supply.burned;
    }

    if (supply.initialMinted) {
      token.initialMinted = supply.initialMinted;
    }
  }

  async getTokenSupply(identifier: string, denominated: boolean | undefined = undefined): Promise<TokenSupplyResult | undefined> {
    const properties = await this.getTokenProperties(identifier);
    if (!properties) {
      return undefined;
    }

    const result = await this.esdtService.getTokenSupply(identifier);

    const totalSupply = NumberUtils.denominateString(result.totalSupply, properties.decimals);
    const circulatingSupply = NumberUtils.denominateString(result.circulatingSupply, properties.decimals);

    let lockedAccounts = result.lockedAccounts;
    if (lockedAccounts !== undefined) {
      lockedAccounts = JSON.parse(JSON.stringify(lockedAccounts));
      if (denominated === true) {
        // @ts-ignore
        for (const lockedAccount of lockedAccounts) {
          lockedAccount.balance = NumberUtils.denominateString(lockedAccount.balance.toString(), properties.decimals);
        }
      }
    }

    return {
      supply: denominated === true ? totalSupply : totalSupply.toFixed(),
      circulatingSupply: denominated === true ? circulatingSupply : circulatingSupply.toFixed(),
      minted: denominated === true && result.minted ? NumberUtils.denominateString(result.minted, properties.decimals) : result.minted,
      burnt: denominated === true && result.burned ? NumberUtils.denominateString(result.burned, properties.decimals) : result.burned,
      initialMinted: denominated === true && result.initialMinted ? NumberUtils.denominateString(result.initialMinted, properties.decimals) : result.initialMinted,
      lockedAccounts,
    };
  }

  async getTokenProperties(identifier: string): Promise<TokenProperties | undefined> {
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

    return properties;
  }

  async getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number> {
    return await this.indexerService.getTokensWithRolesForAddressCount(address, filter);
  }

  async getTokenWithRolesForAddress(address: string, identifier: string): Promise<TokenWithRoles | undefined> {
    const tokens = await this.getTokensWithRolesForAddress(address, { identifier }, { from: 0, size: 1 });
    if (tokens.length === 0) {
      return undefined;
    }

    return tokens[0];
  }

  async getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<TokenWithRoles[]> {
    const tokenList = await this.indexerService.getTokensWithRolesForAddress(address, filter, pagination);

    const allTokens = await this.esdtService.getAllEsdtTokens();

    const result: TokenWithRoles[] = [];

    for (const item of tokenList) {
      const token = allTokens.find(x => x.identifier === item.identifier);
      if (token) {
        const resultItem = ApiUtils.mergeObjects(new TokenWithRoles(), token);
        if (item.roles) {
          if (item.roles.ESDTRoleLocalMint && item.roles.ESDTRoleLocalMint.includes(address)) {
            resultItem.canLocalMint = true;
          }

          if (item.roles.ESDTRoleLocalBurn && item.roles.ESDTRoleLocalBurn.includes(address)) {
            resultItem.canLocalBurn = true;
          }
        }

        result.push(resultItem);
      }
    }

    return result;
  }
}
