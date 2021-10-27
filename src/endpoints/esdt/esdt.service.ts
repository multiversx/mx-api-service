import { Inject, Injectable, Logger } from "@nestjs/common";
import { MetricsService } from "src/common/metrics/metrics.service";
import { TokenDetailed } from "src/endpoints/tokens/entities/token.detailed";
import { TokenProperties } from "src/endpoints/tokens/entities/token.properties";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { AddressUtils } from "src/utils/address.utils";
import { Constants } from "src/utils/constants";
import { TokenUtils } from "src/utils/tokens.utils";
import { ApiConfigService } from "../../common/api-config/api.config.service";
import { CachingService } from "../../common/caching/caching.service";
import { ProxyService } from "src/endpoints/proxy/proxy.service";
import { GENESIS_TIMESTAMP_SERVICE, GenesisTimestampInterface } from "../../utils/genesis.timestamp.interface";

@Injectable()
export class EsdtService {
  private readonly logger: Logger

  constructor(
    private readonly proxyService: ProxyService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly metricsService: MetricsService,
    @Inject(GENESIS_TIMESTAMP_SERVICE)
    private readonly genesisTimestampService: GenesisTimestampInterface
  ) {
    this.logger = new Logger(EsdtService.name);
  }

  private async getAllEsdtsForAddressRaw(address: string): Promise<{ [ key: string]: any }> {
    try {
      let esdtResult = await this.proxyService.getEsdtTokens(address);
      return esdtResult.esdts;
    } catch (error: any) {
      let errorMessage = error?.response?.data?.error;
      if (errorMessage && errorMessage.includes('account was not found')) {
        return {};
      }
      
      throw error;
    }
  }

  private pendingRequestsDictionary: { [ key: string]: any; } = {};
  
  async getAllEsdtsForAddress(address: string): Promise<{ [ key: string]: any }> {
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

    pendingRequest = this.getAllEsdtsForAddressRaw(address);
    this.pendingRequestsDictionary[address] = pendingRequest;

    let esdts: { [ key: string]: any };
    try {
      esdts = await pendingRequest;
    } finally {
      delete this.pendingRequestsDictionary[address];
    }

    let ttl = await this.genesisTimestampService.getSecondsRemainingUntilNextRound();

    await this.cachingService.setCacheLocal(`address:${address}:esdts`, esdts, ttl);
    return esdts;
  }

  async getAllEsdtTokens(): Promise<TokenDetailed[]> {
    return this.cachingService.getOrSetCache(
      'allEsdtTokens',
      async () => await this.getAllEsdtTokensRaw(),
      Constants.oneHour()
    );
  }

  async getAllEsdtTokensRaw(): Promise<TokenDetailed[]> {
    let tokensIdentifiers: string[];
    try {
      const getFungibleTokensResult = await this.proxyService.getFungibleTokens();
      tokensIdentifiers = getFungibleTokensResult.tokens;
    } catch (error) {
      this.logger.error('Error when getting fungible tokens from gateway');
      this.logger.error(error);
      return [];
    }

    let tokens = await this.cachingService.batchProcess(
      tokensIdentifiers,
      (token: string) => `token:${token}`,
      async (token: string) => await this.getEsdtTokenProperties(token),
      Constants.oneDay()
    );

    // @ts-ignore
    return tokens;
  }

  async getEsdtTokenProperties(identifier: string): Promise<TokenProperties | null> {
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
}