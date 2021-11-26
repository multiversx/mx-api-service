import { Injectable, Logger } from "@nestjs/common";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { ElasticService } from "src/common/elastic/elastic.service";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryType } from "src/common/elastic/entities/query.type";
import { QueryPagination } from "src/common/entities/query.pagination";
import { MetricsService } from "src/common/metrics/metrics.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { TokenDetailed } from "src/endpoints/tokens/entities/token.detailed";
import { TokenProperties } from "src/endpoints/tokens/entities/token.properties";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { AddressUtils } from "src/utils/address.utils";
import { Constants } from "src/utils/constants";
import { TokenUtils } from "src/utils/tokens.utils";
import { ApiConfigService } from "../../common/api-config/api.config.service";
import { CachingService } from "../../common/caching/caching.service";
import { GatewayService } from "../../common/gateway/gateway.service";

@Injectable()
export class EsdtService {
  private readonly logger: Logger

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly metricsService: MetricsService,
    private readonly protocolService: ProtocolService,
    private readonly elasticService: ElasticService,
  ) {
    this.logger = new Logger(EsdtService.name);
  }

  private async getAllEsdtsForAddressRaw(address: string, queryPagination:  QueryPagination): Promise<{ [ key: string]: any }> {
    return this.getAllEsdtsForAddressFromElastic(address, queryPagination);
  }

  private async getAllEsdtsForAddressFromElastic(address: string, queryPagination: QueryPagination): Promise<{ [ key: string]: any }> {
    let elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [ QueryType.Match('address', address) ])
      .withPagination(queryPagination)
      .withCondition(QueryConditionOptions.mustNot, [ QueryType.Match('address', 'pending') ]);

    let esdts = await this.elasticService.getList('accountsesdt', 'identifier', elasticQuery);

    let result: { [ key: string]: any } = {};

    for (let esdt of esdts) {
      let isToken = esdt.tokenNonce === undefined;
      if (isToken) {
        result[esdt.token] = {
          balance: esdt.balance,
          tokenIdentifier: esdt.token,
        };
      } else {
        result[esdt.identifier] = {
          attributes: esdt.data?.attributes,
          balance: esdt.balance,
          creator: esdt.data?.creator,
          name: esdt.data?.name,
          nonce: esdt.tokenNonce,
          royalties: esdt.data?.royalties,
          tokenIdentifier: esdt.identifier,
          uris: esdt.data?.uris,
        };
      }
    }

    return result;
  }

  // @ts-ignore
  private async getAllEsdtsForAddressFromGateway(address: string): Promise<{ [ key: string]: any }> {
    let esdtResult = await this.gatewayService.get(`address/${address}/esdt`, async (error) => {
      let errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return true;
      }

      return false;
    });

    if (!esdtResult) {
      return {};
    }

    return esdtResult.esdts;
  }

  private pendingRequestsDictionary: { [ key: string]: any; } = {};
  
  async getAllEsdtsForAddress(address: string, queryPagination: QueryPagination): Promise<{ [ key: string]: any }> {
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

    pendingRequest = this.getAllEsdtsForAddressRaw(address, queryPagination);
    this.pendingRequestsDictionary[address] = pendingRequest;

    let esdts: { [ key: string]: any };
    try {
      esdts = await pendingRequest;
    } finally {
      delete this.pendingRequestsDictionary[address];
    }

    let ttl = await this.protocolService.getSecondsRemainingUntilNextRound();

    await this.cachingService.setCacheLocal(`address:${address}:esdts`, esdts, ttl);
    return esdts;
  }

  async getAllEsdtTokens(): Promise<TokenDetailed[]> {
    return this.cachingService.getOrSetCache(
      CacheInfo.AllEsdtTokens.key,
      async () => await this.getAllEsdtTokensRaw(),
      CacheInfo.AllEsdtTokens.ttl
    );
  }

  async getAllEsdtTokensRaw(): Promise<TokenDetailed[]> {
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
      token => `esdt:${token}`,
      async (token: string) => await this.getEsdtTokenPropertiesRaw(token),
      Constants.oneDay(),
      true
    );

    // @ts-ignore
    return tokens;
  }

  async getEsdtTokenProperties(identifier: string): Promise<TokenProperties | undefined> {
    let properties = await this.cachingService.getOrSetCache(
      `esdt:${identifier}`,
      async () => await this.getEsdtTokenPropertiesRaw(identifier),
      Constants.oneWeek(),
      Constants.oneDay()
    );

    if (!properties) {
      return undefined;
    }
    
    return properties;
  }

  async getEsdtTokenPropertiesRaw(identifier: string): Promise<TokenProperties | null> {
    const arg = Buffer.from(identifier, 'utf8').toString('hex');

    const tokenPropertiesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getTokenProperties',
      undefined,
      [ arg ],
      true
    );

    if (!tokenPropertiesEncoded) {
      this.logger.error(`Could not fetch token properties for token with identifier '${identifier}'`);
      return null;
    }

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

    const tokenProps: TokenProperties = {
      identifier,
      name,
      // @ts-ignore
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
      wiped: wiped.split('-').pop() ?? '',
    };

    if (type === 'FungibleESDT') {
      // @ts-ignore
      delete tokenProps.canAddSpecialRoles;
      // @ts-ignore
      delete tokenProps.canTransferNFTCreateRole;
      // @ts-ignore
      delete tokenProps.NFTCreateStopped;
      // @ts-ignore
      delete tokenProps.wiped;
    }

    return tokenProps;
  };

  async getTokenSupply(identifier: string): Promise<string> {
    const { supply } = await this.gatewayService.get(`network/esdt/supply/${identifier}`);

    return supply;
  }
}