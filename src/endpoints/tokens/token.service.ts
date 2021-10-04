import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api.config.service";
import { CachingService } from "src/common/caching.service";
import { GatewayService } from "src/common/gateway.service";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { Token } from "./entities/token";
import { TokenWithBalance } from "./entities/token.with.balance";
import { TokenDetailed } from "./entities/token.detailed";
import { TokenAssetService } from "src/common/token.asset.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { Constants } from "src/utils/constants";
import { AddressUtils } from "src/utils/address.utils";
import { ApiUtils } from "src/utils/api.utils";
import { TokenFilter } from "./entities/token.filter";
import { TokenUtils } from "src/utils/tokens.utils";
import { MetricsService } from "../metrics/metrics.service";

@Injectable()
export class TokenService {
  private readonly logger: Logger

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly tokenAssetService: TokenAssetService,
    private readonly metricsService: MetricsService,
  ) {
    this.logger = new Logger(TokenService.name);
  }

  async getToken(identifier: string): Promise<TokenDetailed | undefined> {
    let tokens = await this.getAllTokens();
    let token = tokens.find(x => x.identifier === identifier);
    if (token) {
      token.assets = await this.tokenAssetService.getAssets(token.identifier);

      return ApiUtils.mergeObjects(new TokenDetailed(), token);
    }

    return undefined;
  }

  async getTokens(queryPagination: QueryPagination, filter: TokenFilter): Promise<TokenDetailed[]> {
    const { from, size } = queryPagination;

    let tokens = await this.getFilteredTokens(filter);

    tokens = tokens.slice(from, from + size);

    for (let token of tokens) {
      token.assets = await this.tokenAssetService.getAssets(token.identifier);
    }

    return tokens.map(item => ApiUtils.mergeObjects(new TokenDetailed(), item));
  }

  async getFilteredTokens(filter: TokenFilter): Promise<TokenDetailed[]> {
    let tokens = await this.getAllTokens();

    if (filter.search) {
      let searchLower = filter.search.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase().includes(searchLower) || token.identifier.toLowerCase().includes(searchLower));
    }

    if (filter.name) {
      let nameLower = filter.name.toLowerCase();

      tokens = tokens.filter(token => token.name.toLowerCase().includes(nameLower));
    }

    if (filter.identifier) {
      let identifierLower = filter.identifier.toLowerCase();

      tokens = tokens.filter(token => token.identifier.toLowerCase().includes(identifierLower));
    }

    if (filter.identifiers) {
      const identifierArray = filter.identifiers.split(',').map(identifier => identifier.toLowerCase());

      tokens = tokens.filter(token => identifierArray.includes(token.identifier.toLowerCase()));
    }
    
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
    const { from, size } = queryPagination;
    
    let tokens = await this.getAllTokensForAddress(address, filter);

    tokens = tokens.slice(from, from + size);

    for (let token of tokens) {
      token.assets = await this.tokenAssetService.getAssets(token.identifier);
    }

    return tokens.map(token => ApiUtils.mergeObjects(new TokenWithBalance(), token));
  }
  
  private async getAllEsdtsRaw(address: string): Promise<{ [ key: string]: any }> {
    try {
      let esdtResult = await this.gatewayService.get(`address/${address}/esdt`);
      return esdtResult.esdts;
    } catch (error) {
      let errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return {};
      }
      
      throw error;
    }
  }

  async getTokenForAddress(address: string, tokenIdentifier: string): Promise<TokenWithBalance | undefined> {
    let allTokens = await this.getAllTokensForAddress(address, new TokenFilter());

    let foundToken = allTokens.find(x => x.identifier === tokenIdentifier);
    if (!foundToken) {
      return undefined;
    }

    foundToken.assets = await this.tokenAssetService.getAssets(tokenIdentifier);

    return foundToken;
  }

  private pendingRequestsDictionary: { [ key: string]: any; } = {};
  
  async getAllEsdts(address: string): Promise<{ [ key: string]: any }> {
    let pendingRequest = this.pendingRequestsDictionary[address];
    if (pendingRequest) {
      let result = await pendingRequest;
      this.metricsService.incrementPendingApiHit('Gateway.AccountEsdts');
      return result;
    }

    let cachedValue = await this.cachingService.getCacheLocal<{ [ key: string]: any }>(`address:${address}:esdts`);
    if (cachedValue) {
      this.metricsService.incrementCachedApiHit('Gateway.AccountEsdts');
      return cachedValue;
    }

    pendingRequest = this.getAllEsdtsRaw(address);
    this.pendingRequestsDictionary[address] = pendingRequest;

    let esdts: { [ key: string]: any };
    try {
      esdts = await pendingRequest;
    } finally {
      delete this.pendingRequestsDictionary[address];
    }

    let ttl = await this.cachingService.getSecondsRemainingUntilNextRound();

    await this.cachingService.setCacheLocal(`address:${address}:esdts`, esdts, ttl);
    return esdts;
  }

  async getAllTokensForAddress(address: string, filter: TokenFilter): Promise<TokenWithBalance[]> {
    let tokens = await this.getFilteredTokens(filter);

    let tokensIndexed: { [index: string]: Token } = {};
    for (let token of tokens) {
      tokensIndexed[token.identifier] = token;
    }

    let esdts = await this.getAllEsdts(address);

    let tokensWithBalance: TokenWithBalance[] = [];

    for (let tokenIdentifier of Object.keys(esdts)) {
      if (!TokenUtils.isEsdt(tokenIdentifier)) {
        continue;
      }

      let esdt = esdts[tokenIdentifier];
      let token = tokensIndexed[tokenIdentifier];
      if (!token) {
        this.logger.log(`Could not find token with identifier ${tokenIdentifier}`);
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

  async getAllTokens(): Promise<TokenDetailed[]> {
    return this.cachingService.getOrSetCache(
      'allTokens',
      async () => await this.getAllTokensRaw(),
      Constants.oneHour()
    );
  }

  async getAllTokensRaw(): Promise<TokenDetailed[]> {
    let tokensIdentifiers: string[];
    try {
      const getFungibleTokensResult = await this.gatewayService.get('network/esdt/fungible-tokens');

      tokensIdentifiers = getFungibleTokensResult.tokens;
    } catch (error) {
      this.logger.error('Error when getting fungible tokens from gateway');
      this.logger.error(error);
      return [];
    }

    let tokens = await this.cachingService.batchProcess(
      tokensIdentifiers,
      token => `tokenProperties:${token}`,
      async (token: string) => await this.getTokenProperties(token),
      Constants.oneDay()
    );

    // @ts-ignore
    return tokens;
  }

  async getTokenProperties(identifier: string) {
    const arg = Buffer.from(identifier, 'utf8').toString('hex');

    const tokenPropertiesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getTokenProperties',
      undefined,
      [ arg ],
      true
    );

    const tokenProperties = tokenPropertiesEncoded.map((encoded, index) =>
      Buffer.from(encoded, 'base64').toString(index === 2 ? 'hex' : undefined)
    );

    const [
      name,
      type,
      owner,
      minted,
      burnt,
      decimals,
      isPaused,
      canUpgrade,
      canMint,
      canBurn,
      canChangeOwner,
      canPause,
      canFreeze,
      canWipe,
      canAddSpecialRoles,
      canTransferNFTCreateRole,
      NFTCreateStopped,
      wiped,
    ] = tokenProperties;

    const tokenProps = {
      identifier,
      name,
      type,
      owner: AddressUtils.bech32Encode(owner),
      minted,
      burnt,
      decimals: parseInt(decimals.split('-').pop() ?? '0'),
      isPaused: TokenUtils.canBool(isPaused),
      canUpgrade: TokenUtils.canBool(canUpgrade),
      canMint: TokenUtils.canBool(canMint),
      canBurn: TokenUtils.canBool(canBurn),
      canChangeOwner: TokenUtils.canBool(canChangeOwner),
      canPause: TokenUtils.canBool(canPause),
      canFreeze: TokenUtils.canBool(canFreeze),
      canWipe: TokenUtils.canBool(canWipe),
      canAddSpecialRoles: TokenUtils.canBool(canAddSpecialRoles),
      canTransferNFTCreateRole: TokenUtils.canBool(canTransferNFTCreateRole),
      NFTCreateStopped: TokenUtils.canBool(NFTCreateStopped),
      wiped: wiped.split('-').pop(),
    };

    if (type === 'FungibleESDT') {
      // @ts-ignore
      delete tokenProps.canAddSpecialRoles;
      // @ts-ignore
      delete tokenProps.canTransferNFTCreateRole;
      // @ts-ignore
      delete tokenProps.NFTCreateStopped;
      delete tokenProps.wiped;
    }

    return tokenProps;
  };
}