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
import { AddressUtils, BinaryUtils, Constants, CachingService } from "@multiversx/sdk-nestjs";
import { IndexerService } from "src/common/indexer/indexer.service";
import { EsdtType } from "./entities/esdt.type";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";

@Injectable()
export class EsdtService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly indexerService: IndexerService,
    @Inject(forwardRef(() => AssetsService))
    private readonly assetsService: AssetsService,
    private readonly elasticIndexerService: ElasticIndexerService
  ) { }

  async getEsdtTokenProperties(identifier: string): Promise<TokenProperties | undefined> {
    const properties = await this.cachingService.getOrSetCache(
      CacheInfo.EsdtProperties(identifier).key,
      async () => await this.getEsdtTokenPropertiesRaw(identifier),
      Constants.oneWeek(),
      CacheInfo.EsdtProperties(identifier).ttl
    );

    if (!properties) {
      return undefined;
    }

    return properties;
  }

  async getEsdtAddressesRoles(identifier: string): Promise<TokenRoles[] | undefined> {
    const addressesRoles = await this.cachingService.getOrSetCache(
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
    const elastic = await this.elasticIndexerService.getEsdtProperties(identifier);

    if (!elastic) {
      return null;
    }

    const tokenProps: TokenProperties = new TokenProperties({
      identifier: identifier,
      name: elastic.name,
      type: elastic.type as EsdtType,
      owner: elastic.currentOwner,
      decimals: elastic.numDecimals,
      canUpgrade: elastic.properties.canUpgrade,
      canMint: elastic.properties.canMint,
      canBurn: elastic.properties.canBurn,
      canChangeOwner: elastic.properties.canChangeOwner,
      canPause: elastic.properties.canPause,
      canFreeze: elastic.properties.canFreeze,
      canWipe: elastic.properties.canWipe,
      canAddSpecialRoles: elastic.properties.canAddSpecialRoles,
      canTransferNFTCreateRole: elastic.properties.canTransferNFTCreateRole,
      NFTCreateStopped: elastic.properties.NFTCreateStopped,
    } as unknown as TokenProperties);

    if (elastic.type === 'FungibleESDT') {
      // @ts-ignore
      delete tokenProps.canTransferNFTCreateRole;
      // @ts-ignore
      delete tokenProps.NFTCreateStopped;
    }
    return tokenProps;
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

    const tokenAddressesAndRoles: TokenRoles[] = [];
    let currentAddressRoles = new TokenRoles();
    for (const valueEncoded of tokenAddressesAndRolesEncoded) {
      const address = BinaryUtils.tryBase64ToAddress(valueEncoded);
      if (address) {
        if (currentAddressRoles.address) {
          tokenAddressesAndRoles.push(currentAddressRoles);
        }

        currentAddressRoles = new TokenRoles();
        currentAddressRoles.address = address;

        continue;
      }

      const role = BinaryUtils.base64Decode(valueEncoded);
      TokenHelpers.setTokenRole(currentAddressRoles, role);
    }

    if (currentAddressRoles.address) {
      tokenAddressesAndRoles.push(currentAddressRoles);
    }

    return tokenAddressesAndRoles;
  }

  private async getLockedAccounts(identifier: string): Promise<EsdtLockedAccount[]> {
    return await this.cachingService.getOrSetCache(
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

  async countAllAccounts(identifiers: string[]): Promise<number> {
    const key = `tokens:${identifiers[0]}:distinctAccounts`;

    for (const identifier of identifiers) {
      await this.indexerService.getAllAccountsWithToken(identifier, async items => {
        const distinctAccounts: string[] = items.map(x => x.address).distinct();
        if (distinctAccounts.length > 0) {
          await this.cachingService.setAdd(key, ...distinctAccounts);
        }
      });
    }

    const count = await this.cachingService.setCount(key);

    await this.cachingService.deleteInCache(key);

    return count;
  }

  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<any[]> {
    return await this.indexerService.getAccountEsdtByAddressesAndIdentifier(identifier, addresses);
  }
}
