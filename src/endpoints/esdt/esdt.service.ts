import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { ElasticService } from "src/common/elastic/elastic.service";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryOperator } from "src/common/elastic/entities/query.operator";
import { QueryType } from "src/common/elastic/entities/query.type";
import { GatewayComponentRequest } from "src/common/gateway/entities/gateway.component.request";
import { TokenProperties } from "src/endpoints/tokens/entities/token.properties";
import { VmQueryService } from "src/endpoints/vm.query/vm.query.service";
import { AddressUtils } from "src/utils/address.utils";
import { ApiUtils } from "src/utils/api.utils";
import { BinaryUtils } from "src/utils/binary.utils";
import { Constants } from "src/utils/constants";
import { NumberUtils } from "src/utils/number.utils";
import { TokenUtils } from "src/utils/token.utils";
import { ApiConfigService } from "../../common/api-config/api.config.service";
import { CachingService } from "../../common/caching/caching.service";
import { GatewayService } from "../../common/gateway/gateway.service";
import { MexTokenService } from "../mex/mex.token.service";
import { TokenAssets } from "../tokens/entities/token.assets";
import { TokenDetailed } from "../tokens/entities/token.detailed";
import { TokenRoles } from "../tokens/entities/token.roles";
import { TokenAssetService } from "../tokens/token.asset.service";
import { TransactionService } from "../transactions/transaction.service";
import { EsdtLockedAccount } from "./entities/esdt.locked.account";
import { EsdtSupply } from "./entities/esdt.supply";

@Injectable()
export class EsdtService {
  private readonly logger: Logger;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly vmQueryService: VmQueryService,
    private readonly elasticService: ElasticService,
    @Inject(forwardRef(() => TokenAssetService))
    private readonly tokenAssetService: TokenAssetService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    private readonly mexTokenService: MexTokenService,
  ) {
    this.logger = new Logger(EsdtService.name);
  }

  async getAllEsdtTokens(): Promise<TokenDetailed[]> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.AllEsdtTokens.key,
      async () => await this.getAllEsdtTokensRaw(),
      CacheInfo.AllEsdtTokens.ttl
    );
  }

  async getAllEsdtTokensRaw(): Promise<TokenDetailed[]> {
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
      async (identifier: string) => await this.getEsdtTokenPropertiesRaw(identifier),
      Constants.oneDay(),
      true
    );

    const tokensAssets = await this.cachingService.batchProcess(
      tokensIdentifiers,
      token => CacheInfo.EsdtAssets(token).key,
      async (identifier: string) => await this.getEsdtTokenAssetsRaw(identifier),
      Constants.oneDay(),
      true
    );

    let tokens = tokensProperties.zip(tokensAssets, (first, second) => ApiUtils.mergeObjects(new TokenDetailed, { ...first, assets: second }));

    for (const token of tokens) {
      if (!token.assets) {
        continue;
      }

      let accounts = await this.cachingService.getCacheRemote<number>(CacheInfo.TokenAccountsExtra(token.identifier).key);
      if (!accounts) {
        accounts = await this.cachingService.getOrSetCache(
          CacheInfo.TokenAccounts(token.identifier).key,
          async () => await this.getEsdtAccountsCount(token.identifier),
          CacheInfo.TokenAccounts(token.identifier).ttl
        );
      }

      token.accounts = accounts;

      token.transactions = await this.cachingService.getOrSetCache(
        CacheInfo.TokenTransactions(token.identifier).key,
        async () => await this.transactionService.getTransactionCount({ tokens: [token.identifier, ...token.assets?.extraTokens ?? []] }),
        CacheInfo.TokenTransactions(token.identifier).ttl
      );
    }

    const indexedTokens = await this.mexTokenService.getIndexedMexTokens();
    for (const token of tokens) {
      if (indexedTokens[token.identifier]) {
        const supply = await this.getTokenSupply(token.identifier);

        token.price = indexedTokens[token.identifier].price;
        token.marketCap = indexedTokens[token.identifier].price * NumberUtils.denominateString(supply.circulatingSupply, token.decimals);
      }
    }

    tokens = tokens.sortedDescending(token => token.transactions ?? 0);

    return tokens;
  }

  async getEsdtAccountsCount(identifier: string): Promise<number> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [QueryType.Match("token", identifier, QueryOperator.AND)]);

    const count = await this.elasticService.getCount("accountsesdt", elasticQuery);

    return count;
  }

  private async getEsdtTokenAssetsRaw(identifier: string): Promise<TokenAssets | undefined> {
    return await this.tokenAssetService.getAssets(identifier);
  }

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

  async getEsdtTokenPropertiesRaw(identifier: string): Promise<TokenProperties | null> {
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
      TokenUtils.setTokenRole(currentAddressRoles, role);
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
    const tokenAssets = await this.tokenAssetService.getAssets(identifier);
    if (!tokenAssets) {
      return [];
    }

    const lockedAccounts = tokenAssets.lockedAccounts;
    if (!lockedAccounts) {
      return [];
    }

    const lockedAccountsWithDescriptions: EsdtLockedAccount[] = [];
    if (Array.isArray(lockedAccounts)) {
      for (const [index, lockedAccount] of lockedAccounts.entries()) {
        lockedAccountsWithDescriptions.push({
          address: lockedAccount,
          name: `Locked account #${index + 1}`,
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

    const esdtLockedAccounts = await this.elasticService.getAccountEsdtByAddressesAndIdentifier(identifier, addresses);

    for (const esdtLockedAccount of esdtLockedAccounts) {
      const lockedAccountWithDescription = lockedAccountsWithDescriptions.find(x => x.address === esdtLockedAccount.address);
      if (lockedAccountWithDescription) {
        lockedAccountWithDescription.balance = esdtLockedAccount.balance;
      }
    }

    return lockedAccountsWithDescriptions;
  }

  async getTokenSupply(identifier: string): Promise<EsdtSupply> {
    const { supply, minted, burned, initialMinted } = await this.gatewayService.get(`network/esdt/supply/${identifier}`, GatewayComponentRequest.esdtSupply);

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
      const query = ElasticQuery.create()
        .withPagination({ from: 0, size: 10000 })
        .withMustMatchCondition('token', identifier, QueryOperator.AND);

      await this.elasticService.getScrollableList('accountsesdt', 'id', query, async items => {
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
}
