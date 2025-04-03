import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CacheInfo } from "src/utils/cache.info";
import { TokenProperties } from "src/endpoints/tokens/entities/token.properties";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { TokenHelpers } from "src/utils/token.helpers";
import { ApiConfigService } from "../../common/api-config/api.config.service";
import { GatewayService } from "../../common/gateway/gateway.service";
import { TokenRoles } from "../tokens/entities/token.roles";
import { AssetsService } from "../../common/assets/assets.service";
import { EsdtLockedAccount } from "./entities/esdt.locked.account";
import { EsdtSupply } from "./entities/esdt.supply";
import { BinaryUtils, Constants, AddressUtils, OriginLogger, BatchUtils } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { IndexerService } from "src/common/indexer/indexer.service";
import { EsdtType } from "./entities/esdt.type";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { randomUUID } from "crypto";
import { EsdtSubType } from "./entities/esdt.sub.type";

@Injectable()
export class EsdtService {
  private readonly logger = new OriginLogger(EsdtService.name);

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CacheService,
    private readonly vmQueryService: VmQueryService,
    private readonly indexerService: IndexerService,
    @Inject(forwardRef(() => AssetsService))
    private readonly assetsService: AssetsService,
    private readonly elasticIndexerService: ElasticIndexerService
  ) { }

  async getEsdtTokenProperties(identifier: string): Promise<TokenProperties | undefined> {
    try {
      const properties = await this.cachingService.getOrSet(
        CacheInfo.EsdtProperties(identifier).key,
        async () => await this.getEsdtTokenPropertiesRaw(identifier),
        Constants.oneWeek(),
        CacheInfo.EsdtProperties(identifier).ttl
      );

      if (!properties) {
        return undefined;
      }

      return properties;
    } catch (error) {
      this.logger.error(`Error when getting esdt token properties for identifier: ${identifier}`);
      this.logger.error(error);
      return undefined;
    }
  }

  async getCollectionProperties(identifier: string): Promise<TokenProperties | undefined> {
    const properties = await this.cachingService.getOrSet(
      CacheInfo.CollectionProperties(identifier).key,
      async () => await this.getEsdtTokenPropertiesRawFromGateway(identifier),
      Constants.oneWeek(),
      CacheInfo.CollectionProperties(identifier).ttl
    );

    if (!properties) {
      return undefined;
    }

    return properties;
  }

  async getEsdtAddressesRoles(identifier: string): Promise<TokenRoles[] | undefined> {
    const addressesRoles = await this.cachingService.getOrSet(
      CacheInfo.EsdtAddressesRoles(identifier).key,
      async () => await this.getEsdtAddressesRolesRaw(identifier),
      Constants.oneWeek(),
      CacheInfo.EsdtAddressesRoles(identifier).ttl
    );

    if (!addressesRoles) {
      return undefined;
    }

    return addressesRoles;
  }

  async getEsdtTokenPropertiesRaw(identifier: string): Promise<TokenProperties | null> {
    const getCollectionPropertiesFromGateway = this.apiConfigService.getCollectionPropertiesFromGateway();
    if (!getCollectionPropertiesFromGateway) {
      return await this.getEsdtTokenPropertiesRawFromElastic(identifier);
    } else {
      return await this.getEsdtTokenPropertiesRawFromGateway(identifier);
    }
  }

  async getEsdtTokenPropertiesRawFromElastic(identifier: string): Promise<TokenProperties | null> {
    const elasticProperties = await this.elasticIndexerService.getEsdtProperties(identifier);
    return this.mapEsdtTokenPropertiesFromElastic(elasticProperties);
  }

  async getEsdtTokenPropertiesRawFromGateway(identifier: string): Promise<TokenProperties | null> {
    const arg = Buffer.from(identifier, 'utf8').toString('hex');

    const tokenPropertiesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getTokenProperties',
      undefined,
      [arg],
      undefined,
      true
    );

    if (!tokenPropertiesEncoded) {
      // this.logger.error(`Could not fetch token properties for token with identifier '${identifier}'`);
      return null;
    }

    const tokenProperties = tokenPropertiesEncoded.map((encoded, index) =>
      Buffer.from(encoded, 'base64').toString(index === 2 ? 'hex' : undefined)
    );

    const [
      name,
      type,
      owner,
      _,
      __,
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
      decimals: parseInt(decimals.split('-').pop() ?? '0'),
      isPaused: TokenHelpers.canBool(isPaused),
      canUpgrade: TokenHelpers.canBool(canUpgrade),
      canMint: TokenHelpers.canBool(canMint),
      canBurn: TokenHelpers.canBool(canBurn),
      canChangeOwner: TokenHelpers.canBool(canChangeOwner),
      canPause: TokenHelpers.canBool(canPause),
      canFreeze: TokenHelpers.canBool(canFreeze),
      canWipe: TokenHelpers.canBool(canWipe),
      canAddSpecialRoles: TokenHelpers.canBool(canAddSpecialRoles),
      canTransferNFTCreateRole: TokenHelpers.canBool(canTransferNFTCreateRole),
      NFTCreateStopped: TokenHelpers.canBool(NFTCreateStopped),
      wiped: wiped.split('-').pop() ?? '',
    };

    if (type === 'FungibleESDT') {
      // @ts-ignore
      delete tokenProps.canTransferNFTCreateRole;
      // @ts-ignore
      delete tokenProps.NFTCreateStopped;
      // @ts-ignore
      delete tokenProps.wiped;
    }

    this.applySubType(tokenProps, type);

    return tokenProps;
  }

  async getAllFungibleTokenProperties(): Promise<TokenProperties[]> {
    if (!this.apiConfigService.getCollectionPropertiesFromGateway()) {
      return await this.getAllFungibleTokenPropertiesFromElastic();
    } else {
      return await this.getAllFungibleTokenPropertiesFromGateway();
    }
  }

  async getAllFungibleTokenPropertiesFromElastic(): Promise<TokenProperties[]> {
    const elasticProperties = await this.elasticIndexerService.getAllFungibleTokens();
    return elasticProperties.map(property => this.mapEsdtTokenPropertiesFromElastic(property));
  }

  async getAllFungibleTokenPropertiesFromGateway(): Promise<TokenProperties[]> {
    let tokensIdentifiers: string[];
    try {
      tokensIdentifiers = await this.gatewayService.getEsdtFungibleTokens();
    } catch (error) {
      this.logger.error('Error when getting fungible tokens from gateway');
      this.logger.error(error);
      return [];
    }

    const tokensProperties = await this.cachingService.batchProcess(
      tokensIdentifiers,
      token => CacheInfo.EsdtProperties(token).key,
      async (identifier: string) => await this.getEsdtTokenPropertiesRawFromGateway(identifier),
      Constants.oneDay(),
      true
    );

    return tokensProperties.filter(x => x !== null) as TokenProperties[];
  }

  private mapEsdtTokenPropertiesFromElastic(elasticProperties: any): TokenProperties {
    const tokenProps = new TokenProperties({
      identifier: elasticProperties.identifier,
      name: elasticProperties.name,
      type: elasticProperties.type as EsdtType,
      subType: elasticProperties.type as EsdtSubType,
      owner: elasticProperties.currentOwner,
      ownersHistory: elasticProperties.ownersHistory,
      decimals: elasticProperties.numDecimals,
      canUpgrade: elasticProperties.properties?.canUpgrade ?? false,
      canMint: elasticProperties.properties?.canMint ?? false,
      canBurn: elasticProperties.properties?.canBurn ?? false,
      canChangeOwner: elasticProperties.properties?.canChangeOwner ?? false,
      canPause: elasticProperties.properties?.canPause ?? false,
      canFreeze: elasticProperties.properties?.canFreeze ?? false,
      canWipe: elasticProperties.properties?.canWipe ?? false,
      canAddSpecialRoles: elasticProperties.properties?.canAddSpecialRoles ?? false,
      canTransferNFTCreateRole: elasticProperties.properties?.canTransferNFTCreateRole ?? false,
      NFTCreateStopped: elasticProperties.properties?.NFTCreateStopped ?? false,
      isPaused: elasticProperties.paused ?? false,
      timestamp: elasticProperties.timestamp,
    });

    if (elasticProperties.type === 'FungibleESDT') {
      // @ts-ignore
      delete tokenProps.canTransferNFTCreateRole;
      // @ts-ignore
      delete tokenProps.NFTCreateStopped;
    }

    this.applySubType(tokenProps, elasticProperties.type);

    return tokenProps;
  }

  private applySubType(tokenProps: TokenProperties, type: string): void {
    switch (type) {
      case EsdtSubType.NonFungibleESDTv2:
      case EsdtSubType.DynamicNonFungibleESDT:
        tokenProps.type = EsdtType.NonFungibleESDT;
        tokenProps.subType = type;
        break;
      case EsdtSubType.DynamicSemiFungibleESDT:
        tokenProps.type = EsdtType.SemiFungibleESDT;
        tokenProps.subType = type;
        break;
      case EsdtSubType.DynamicMetaESDT:
        tokenProps.type = EsdtType.MetaESDT;
        tokenProps.subType = type;
        break;
    }
  }

  async getEsdtAddressesRolesRaw(identifier: string): Promise<TokenRoles[] | null> {
    const arg = BinaryUtils.stringToHex(identifier);

    const tokenAddressesAndRolesEncoded = await this.vmQueryService.vmQuery(
      this.apiConfigService.getEsdtContractAddress(),
      'getAllAddressesAndRoles',
      undefined,
      [arg],
      undefined,
      true
    );

    if (!tokenAddressesAndRolesEncoded) {
      return [];
    }

    return this.processEncodedAddressesAndRoles(tokenAddressesAndRolesEncoded);
  }

  private processEncodedAddressesAndRoles(encodedData: any[]): TokenRoles[] {
    const result: TokenRoles[] = [];
    let currentRole: TokenRoles | null = null;

    for (const valueEncoded of encodedData) {
      const address = BinaryUtils.tryBase64ToAddress(valueEncoded);

      if (address || valueEncoded === null) {
        if (currentRole && currentRole.address) {
          result.push(currentRole);
        }
        currentRole = new TokenRoles();
        currentRole.address = address;
      } else {
        if (!currentRole) {
          currentRole = new TokenRoles();
        }

        const role = BinaryUtils.base64Decode(valueEncoded);
        TokenHelpers.setTokenRole(currentRole, role);
      }
    }

    if (currentRole && currentRole.address) {
      result.push(currentRole);
    }

    return result;
  }

  private async getLockedAccounts(identifier: string): Promise<EsdtLockedAccount[]> {
    return await this.cachingService.getOrSet(
      CacheInfo.TokenLockedAccounts(identifier).key,
      async () => await this.getLockedAccountsRaw(identifier),
      CacheInfo.TokenLockedAccounts(identifier).ttl,
    );
  }

  async getLockedAccountsRaw(identifier: string): Promise<EsdtLockedAccount[]> {
    const tokenAssets = await this.assetsService.getTokenAssets(identifier);
    if (!tokenAssets) {
      return [];
    }

    const lockedAccounts = tokenAssets.lockedAccounts;
    if (!lockedAccounts) {
      return [];
    }

    const lockedAccountsWithDescriptions: EsdtLockedAccount[] = [];
    if (Array.isArray(lockedAccounts)) {
      for (const lockedAccount of lockedAccounts) {
        lockedAccountsWithDescriptions.push({
          address: lockedAccount,
          name: undefined,
          balance: '0',
        });
      }
    } else {
      for (const address of Object.keys(lockedAccounts)) {
        lockedAccountsWithDescriptions.push({
          address,
          name: lockedAccounts[address],
          balance: '0',
        });
      }
    }

    if (Object.keys(lockedAccounts).length === 0) {
      return [];
    }

    const addresses = lockedAccountsWithDescriptions.map(x => x.address);

    const esdtLockedAccounts = await this.getAccountEsdtByAddressesAndIdentifier(identifier, addresses);

    for (const esdtLockedAccount of esdtLockedAccounts) {
      const lockedAccountWithDescription = lockedAccountsWithDescriptions.find(x => x.address === esdtLockedAccount.address);
      if (lockedAccountWithDescription) {
        lockedAccountWithDescription.balance = esdtLockedAccount.balance;
      }
    }

    return lockedAccountsWithDescriptions;
  }

  async getTokenSupply(identifier: string): Promise<EsdtSupply> {
    const { supply, minted, burned, initialMinted } = await this.gatewayService.getEsdtSupply(identifier);

    const isCollectionOrToken = identifier.split('-').length === 2;
    if (isCollectionOrToken) {
      let circulatingSupply = BigInt(supply);

      const lockedAccounts = await this.getLockedAccounts(identifier);
      if (lockedAccounts && lockedAccounts.length > 0) {
        const totalLockedSupply = lockedAccounts.sumBigInt(x => BigInt(x.balance));

        circulatingSupply = BigInt(supply) - totalLockedSupply;
      }

      return {
        totalSupply: supply,
        circulatingSupply: circulatingSupply.toString(),
        minted,
        burned,
        initialMinted,
        lockedAccounts,
      };
    }

    return {
      totalSupply: supply,
      circulatingSupply: supply,
      minted,
      burned,
      initialMinted,
      lockedAccounts: undefined,
    };
  }

  async countAllDistinctAccounts(identifiers: string[]): Promise<number> {
    const key = `tokens:${identifiers[0]}:distinctAccounts:${randomUUID()}`;

    try {
      for (const identifier of identifiers) {
        await this.indexerService.getAllAccountsWithToken(identifier, async items => {
          const distinctAccounts: string[] = items.map(x => x.address).distinct();
          if (distinctAccounts.length > 0) {
            const chunks = BatchUtils.splitArrayIntoChunks(distinctAccounts, 100);
            for (const chunk of chunks) {
              await this.cachingService.setAddRemote(key, ...chunk);
            }
          }
        });
      }

      return await this.cachingService.setCountRemote(key);
    } finally {
      await this.cachingService.deleteInCache(key);
    }
  }

  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<any[]> {
    return await this.indexerService.getAccountEsdtByAddressesAndIdentifier(identifier, addresses);
  }
}
