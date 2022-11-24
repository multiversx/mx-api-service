import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Token } from "./entities/token";
import { TokenWithBalance } from "./entities/token.with.balance";
import { TokenDetailed } from "./entities/token.detailed";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TokenFilter } from "./entities/token.filter";
import { TokenHelpers } from "src/utils/token.helpers";
import { EsdtService } from "../esdt/esdt.service";
import { TokenAccount } from "./entities/token.account";
import { EsdtType } from "../esdt/entities/esdt.type";
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
import { AddressUtils, ApiUtils, BinaryUtils, CachingService, Constants, NumberUtils, TokenUtils } from "@elrondnetwork/erdnest";
import { IndexerService } from "src/common/indexer/indexer.service";
import { OriginLogger } from "@elrondnetwork/erdnest";
import { TokenLogo } from "./entities/token.logo";
import { AssetsService } from "src/common/assets/assets.service";
import { CacheInfo } from "src/utils/cache.info";
import { TokenAssets } from "src/common/assets/entities/token.assets";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { TransactionService } from "../transactions/transaction.service";
import { MexTokenService } from "../mex/mex.token.service";
import { CollectionService } from "../collections/collection.service";
import { NftType } from "../nfts/entities/nft.type";
import { TokenType } from "src/common/indexer/entities";

@Injectable()
export class TokenService {
  private readonly logger = new OriginLogger(TokenService.name);
  constructor(
    private readonly esdtService: EsdtService,
    private readonly indexerService: IndexerService,
    private readonly esdtAddressService: EsdtAddressService,
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly assetsService: AssetsService,
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    @Inject(forwardRef(() => MexTokenService))
    private readonly mexTokenService: MexTokenService,
    private readonly collectionService: CollectionService,
  ) { }

  async isToken(identifier: string): Promise<boolean> {
    const tokens = await this.getAllTokens();
    return tokens.find(x => x.identifier === identifier) !== undefined;
  }

  async getToken(identifier: string): Promise<TokenDetailed | undefined> {
    const tokens = await this.getAllTokens();
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

    if (token.type === TokenType.FungibleESDT) {
      token.roles = await this.getTokenRoles(identifier);
    } else if (token.type === TokenType.MetaESDT) {
      const elasticCollection = await this.indexerService.getCollection(identifier);
      if (elasticCollection) {
        await this.collectionService.applyCollectionRoles(token, elasticCollection);
      }
    }

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
    let tokens = await this.getAllTokens();

    if (filter.type) {
      tokens = tokens.filter(token => token.type === filter.type);
    }

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

    if (filter.includeMetaESDT !== true) {
      tokens = tokens.filter(token => token.type === TokenType.FungibleESDT);
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

  async getTokenCountForAddress(address: string, filter: TokenFilter): Promise<number> {
    if (AddressUtils.isSmartContractAddress(address)) {
      return await this.getTokenCountForAddressFromElastic(address, filter);
    }

    return await this.getTokenCountForAddressFromGateway(address, filter);
  }

  async getTokenCountForAddressFromElastic(address: string, filter: TokenFilter): Promise<number> {
    return await this.indexerService.getTokenCountForAddress(address, filter);
  }

  async getTokenCountForAddressFromGateway(address: string, filter: TokenFilter): Promise<number> {
    const tokens = await this.getAllTokensForAddress(address, filter);
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

    const allTokens = await this.getAllTokens();

    const allTokensIndexed = allTokens.toRecord<TokenDetailed>(token => token.identifier);

    const result: TokenWithBalance[] = [];
    for (const elasticToken of elasticTokens) {
      if (allTokensIndexed[elasticToken.token]) {
        const token = allTokensIndexed[elasticToken.token];

        const tokenWithBalance: TokenWithBalance = {
          ...token,
          balance: elasticToken.balance,
          attributes: elasticToken.data?.attributes,
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
    const esdtIdentifier = identifier.split('-').slice(0, 2).join('-');

    const tokens = await this.getFilteredTokens({ identifier: esdtIdentifier, includeMetaESDT: true });

    if (!TokenUtils.isToken(identifier) && !TokenUtils.isNft(identifier)) {
      return undefined;
    }

    if (!tokens.length) {
      this.logger.log(`Error when fetching token ${identifier} details for address ${address}`);
      return undefined;
    }

    let gatewayUrl = `address/${address}/esdt/${identifier}`;

    if (TokenUtils.isNft(identifier)) {
      const nonceHex = identifier.split('-').last();
      const nonceNumeric = BinaryUtils.hexToNumber(nonceHex);

      gatewayUrl = `address/${address}/nft/${esdtIdentifier}/nonce/${nonceNumeric}`;
    }

    const token = tokens[0];
    // eslint-disable-next-line require-await
    const esdt = await this.gatewayService.get(gatewayUrl, GatewayComponentRequest.addressEsdtBalance, async (error) => {
      const errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return true;
      }

      return false;
    });

    if (!esdt || !esdt.tokenData || esdt.tokenData.balance === '0') {
      return undefined;
    }

    let tokenWithBalance: TokenDetailedWithBalance = {
      ...token,
      balance: esdt.tokenData.balance,
      attributes: esdt.tokenData.attributes,
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
      const identifier = tokenIdentifier.split('-').slice(0, 2).join('-');

      const esdt = esdts[tokenIdentifier];
      const token = tokensIndexed[identifier];
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

    const result: TokenAccount[] = [];

    for (const tokenAccount of tokenAccounts) {
      result.push(new TokenAccount({
        address: tokenAccount.address,
        balance: tokenAccount.balance,
        attributes: tokenAccount.data?.attributes,
        identifier: tokenAccount.type === TokenType.MetaESDT ? tokenAccount.identifier : undefined,
      }));
    }

    return result;
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
      return [];
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
    if (token.type !== TokenType.FungibleESDT) {
      return;
    }

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
      lockedAccounts: lockedAccounts?.sortedDescending(account => Number(account.balance)),
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

    if (![EsdtType.FungibleESDT, EsdtType.MetaESDT].includes(properties.type)) {
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

    const allTokens = await this.getAllTokens();

    const result: TokenWithRoles[] = [];

    for (const item of tokenList) {
      const token = allTokens.find(x => x.identifier === item.identifier);
      if (token) {
        const resultItem = ApiUtils.mergeObjects(new TokenWithRoles(), token);
        if (item.roles) {
          const addressRoles = Object.keys(item.roles).filter(key => item.roles[key].includes(address));

          if (!item.roles['ESDTTransferRole']) {
            resultItem.canTransfer = true;
          }

          resultItem.roles = new TokenRoles({
            canLocalMint: token.type === TokenType.FungibleESDT ? addressRoles.includes('ESDTRoleLocalMint') : undefined,
            canLocalBurn: token.type === TokenType.FungibleESDT ? addressRoles.includes('ESDTRoleLocalBurn') : undefined,
            canAddQuantity: token.type === TokenType.MetaESDT ? addressRoles.includes('ESDTRoleNFTAddQuantity') : undefined,
            canAddUri: token.type === TokenType.MetaESDT ? addressRoles.includes('ESDTRoleNFTAddURI') : undefined,
            canCreate: token.type === TokenType.MetaESDT ? addressRoles.includes('ESDTRoleNFTCreate') : undefined,
            canBurn: token.type === TokenType.MetaESDT ? addressRoles.includes('ESDTRoleNFTBurn') : undefined,
            canUpdateAttributes: token.type === TokenType.MetaESDT ? addressRoles.includes('ESDTRoleNFTUpdateAttributes') : undefined,
            canTransfer: resultItem.canTransfer === false ? addressRoles.includes('ESDTTransferRole') : undefined,
            roles: addressRoles,
          });
        }

        result.push(resultItem);
      }
    }

    return result;
  }



  private async getLogo(identifier: string): Promise<TokenLogo | undefined> {
    const assets = await this.assetsService.getTokenAssets(identifier);
    if (!assets) {
      return;
    }

    return new TokenLogo({ pngUrl: assets.pngUrl, svgUrl: assets.svgUrl });
  }

  async getLogoPng(identifier: string): Promise<string | undefined> {
    const logo = await this.getLogo(identifier);
    if (!logo) {
      return;
    }

    return logo.pngUrl;
  }

  async getLogoSvg(identifier: string): Promise<string | undefined> {
    const logo = await this.getLogo(identifier);
    if (!logo) {
      return;
    }

    return logo.svgUrl;
  }

  async getTokenMarketCap(): Promise<number> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.TokenMarketCap.key,
      async () => await this.getTokenMarketCapRaw(),
      CacheInfo.TokenMarketCap.ttl,
    );
  }

  async getTokenMarketCapRaw(): Promise<number> {
    let totalMarketCap = 0;

    const tokens = await this.getAllTokens();
    for (const token of tokens) {
      if (token.price && token.marketCap) {
        totalMarketCap += token.marketCap;
      }
    }

    return totalMarketCap;
  }

  async getAllTokens(): Promise<TokenDetailed[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.AllEsdtTokens.key,
      async () => await this.getAllTokensRaw(),
      CacheInfo.AllEsdtTokens.ttl
    );
  }

  async getAllTokensRaw(): Promise<TokenDetailed[]> {
    let tokensIdentifiers: string[];
    try {
      const getFungibleTokensResult = await this.gatewayService.get('network/esdt/fungible-tokens', GatewayComponentRequest.allFungibleTokens);

      tokensIdentifiers = getFungibleTokensResult.tokens;
    } catch (error) {
      this.logger.error('Error when getting fungible tokens from gateway');
      this.logger.error(error);
      return [];
    }

    const tokensProperties = await this.cachingService.batchProcess(
      tokensIdentifiers,
      token => CacheInfo.EsdtProperties(token).key,
      async (identifier: string) => await this.esdtService.getEsdtTokenPropertiesRaw(identifier),
      Constants.oneDay(),
      true
    );

    let tokens = tokensProperties.map(properties => ApiUtils.mergeObjects(new TokenDetailed(), properties));

    for (const token of tokens) {
      token.type = TokenType.FungibleESDT;
    }

    const collections = await this.collectionService.getNftCollections(new QueryPagination({ from: 0, size: 10000 }), { type: [NftType.MetaESDT] });

    for (const collection of collections) {
      tokens.push(new TokenDetailed({
        type: TokenType.MetaESDT,
        identifier: collection.collection,
        name: collection.name,
        timestamp: collection.timestamp,
        owner: collection.owner,
        decimals: collection.decimals,
        canFreeze: collection.canFreeze,
        canPause: collection.canPause,
        canTransferNftCreateRole: collection.canTransferNftCreateRole,
        canWipe: collection.canWipe,
      }));
    }

    await this.batchProcessTokens(tokens);

    await this.applyMexPrices(tokens.filter(x => x.type !== TokenType.MetaESDT));

    await this.cachingService.batchApplyAll(
      tokens,
      token => CacheInfo.EsdtAssets(token.identifier).key,
      async token => await this.getTokenAssetsRaw(token.identifier),
      (token, assets) => token.assets = assets,
      CacheInfo.EsdtAssets('').ttl,
    );

    tokens = tokens.sortedDescending(token => token.assets ? 1 : 0, token => token.marketCap ?? 0, token => token.transactions ?? 0);

    return tokens;
  }

  private async getTokenAssetsRaw(identifier: string): Promise<TokenAssets | undefined> {
    return await this.assetsService.getTokenAssets(identifier);
  }

  private async batchProcessTokens(tokens: TokenDetailed[]) {
    await this.cachingService.batchApplyAll(
      tokens,
      token => CacheInfo.TokenTransactions(token.identifier).key,
      token => this.getTransactionCount(token),
      (token, transactions) => token.transactions = transactions,
      CacheInfo.TokenTransactions('').ttl,
    );

    await this.cachingService.batchApplyAll(
      tokens,
      token => CacheInfo.TokenAccounts(token.identifier).key,
      token => this.getAccountsCount(token),
      (token, accounts) => token.accounts = accounts,
      CacheInfo.TokenAccounts('').ttl,
    );
  }

  private async getTransactionCount(token: TokenDetailed): Promise<number> {
    return await this.transactionService.getTransactionCount(new TransactionFilter({ tokens: [token.identifier, ...token.assets?.extraTokens ?? []] }));
  }

  private async getAccountsCount(token: TokenDetailed): Promise<number> {
    let accounts = await this.cachingService.getCacheRemote<number>(CacheInfo.TokenAccountsExtra(token.identifier).key);
    if (!accounts) {
      accounts = await this.getEsdtAccountsCount(token.identifier);
    }

    return accounts;
  }

  private async getEsdtAccountsCount(identifier: string): Promise<number> {
    return await this.indexerService.getEsdtAccountsCount(identifier);
  }

  private async applyMexPrices(tokens: TokenDetailed[]): Promise<void> {
    try {
      const indexedTokens = await this.mexTokenService.getMexPricesRaw();
      for (const token of tokens) {
        const price = indexedTokens[token.identifier];
        if (price) {
          const supply = await this.esdtService.getTokenSupply(token.identifier);

          if (token.assets && token.identifier.split('-')[0] === 'EGLDUSDC') {
            price.price = price.price / (10 ** 12) * 2;
          }

          if (price.isToken) {
            token.price = price.price;
            token.marketCap = price.price * NumberUtils.denominateString(supply.circulatingSupply, token.decimals);
          }

          token.supply = supply.totalSupply;
          token.circulatingSupply = supply.circulatingSupply;
        }
      }
    } catch (error) {
      this.logger.error('Could not apply mex tokens prices');
      this.logger.error(error);
    }
  }
}
